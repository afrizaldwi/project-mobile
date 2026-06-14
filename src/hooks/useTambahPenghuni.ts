import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";

import { formatRupiah } from "@/utils/format";
import { apiClient } from "@/api/client";
import { getKamarTersedia } from "@/api/kamarService";
import { markKamarCacheDirty } from "@/database/kamarRepository";
import { markPenghuniCacheDirty } from "@/database/penghuniRepository";
import { synchronizePenghuniCache } from "@/database/penghuniSync";
import { getConnectivityStatus } from "@/network/connectivity";
import type { KamarTersedia } from "@/types/kamar";
import {
  fileAssetToUploadFile,
  imageAssetToUploadFile,
  type UploadFilePayload,
} from "@/utils/uploadFile";

export type TipeKamarGroup = string;

interface RoomOption {
  id: string;
  nomor: string;
}

export type RoomGroupData = {
  harga: number;
  fasilitas: string;
  kamar: RoomOption[];
};

type MetodePembayaran = "Tunai" | "Transfer Bank" | "E-Wallet";

type CreatePenghuniResponse = {
  message?: string;
  credentials?: {
    email?: string;
    temporary_password?: string;
  };
};

export type CreatedPenghuniCredentials = {
  email: string;
  temporaryPassword: string;
  noHp: string;
  nama: string;
};

/** Ambil grup tipe dari nomor kamar (A-01, B12, dll). Non A/B/C → "Lainnya" */
function getTipeGroup(nomorKamar: string): TipeKamarGroup {
  const nomor = nomorKamar.trim().toUpperCase();
  const prefixMatch = nomor.match(/^([ABC])(?:[-_\s./]|$)/);
  if (prefixMatch) return prefixMatch[1];

  const first = nomor.charAt(0);
  if (first === "A" || first === "B" || first === "C") return first;

  return "Lainnya";
}

const getTodayInputDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
};

const formatDateForApi = (value: string) => {
  if (!value) return value;
  if (value.length === 10 && value.charAt(4) === "-" && value.charAt(7) === "-")
    return value;
  if (value.includes("/")) {
    const [month, day, year] = value.split("/");
    if (month && day && year) {
      return year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0");
    }
  }
  return value;
};

function normalizeIndonesianPhone(value: string): string | null {
  const digits = value.replace(/[^\d+]/g, "").replace(/^\+/, "");

  if (digits.startsWith("08")) return "628" + digits.slice(2);
  if (digits.startsWith("62")) return digits;

  return null;
}

function buildCredentialMessage(
  credentials: CreatedPenghuniCredentials,
): string {
  return [
    "Halo " + credentials.nama + ",",
    "Akun aplikasi Basecamp Kost sudah dibuat.",
    "Silakan login ke aplikasi menggunakan data berikut:",
    "Email: " + credentials.email,
    "Password: " + credentials.temporaryPassword,
    "Setelah berhasil login, segera ganti password jika menu ubah password sudah tersedia.",
  ].join("\n");
}

export function useTambahPenghuni() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamatAsal, setAlamatAsal] = useState("");

  const [tipeKamar, setTipeKamar] = useState<TipeKamarGroup | null>(null);
  const [kamar, setKamar] = useState("");
  const [tglMasuk, setTglMasuk] = useState(getTodayInputDate);
  const [durasiBulan, setDurasiBulan] = useState("1");
  const [metodePembayaran, setMetodePembayaran] =
    useState<MetodePembayaran>("Transfer Bank");
  const [buktiBayar, setBuktiBayar] = useState<UploadFilePayload | null>(null);
  const [buktiBayarPreview, setBuktiBayarPreview] = useState<string | null>(
    null,
  );

  const [availableRooms, setAvailableRooms] = useState<KamarTersedia[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] =
    useState<CreatedPenghuniCredentials | null>(null);

  const fetchAvailableRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      setRoomsError(null);

      const rooms = await getKamarTersedia();
      setAvailableRooms(rooms);

      if (rooms.length === 0) {
        setRoomsError(
          "Tidak ada kamar berstatus tersedia. Pastikan di menu Data Kamar ada kamar dengan status Tersedia.",
        );
      }
    } catch (error: unknown) {
      setAvailableRooms([]);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        "Tidak dapat mengambil data kamar dari server.";
      setRoomsError(message);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableRooms();
  }, [fetchAvailableRooms]);

  const roomData = useMemo(() => {
    const data: Record<TipeKamarGroup, RoomGroupData> = {};

    availableRooms.forEach((room) => {
      const key = getTipeGroup(room.nomor_kamar);
      const harga = Number(room.harga_bulanan) || 0;

      if (!data[key]) {
        data[key] = { harga: 0, fasilitas: "-", kamar: [] };
      }

      if (data[key].harga === 0) data[key].harga = harga;
      if (room.fasilitas) data[key].fasilitas = room.fasilitas;

      data[key].kamar.push({
        id: String(room.id_kamar),
        nomor: room.nomor_kamar,
      });
    });

    return data;
  }, [availableRooms]);

  const availableTipeList = useMemo(
    () =>
      Object.keys(roomData)
        .filter((tipe) => roomData[tipe].kamar.length > 0)
        .sort((a, b) => {
          const order = ["A", "B", "C", "Lainnya"];
          return order.indexOf(a) - order.indexOf(b);
        }),
    [roomData],
  );

  useEffect(() => {
    if (tipeKamar && !availableTipeList.includes(tipeKamar)) {
      setTipeKamar(null);
      setKamar("");
    }
  }, [tipeKamar, availableTipeList]);

  useEffect(() => {
    if (!isLoadingRooms && availableTipeList.length === 1 && !tipeKamar) {
      setTipeKamar(availableTipeList[0]);
    }
  }, [isLoadingRooms, availableTipeList, tipeKamar]);

  const selectedRoom = useMemo(() => {
    const selectedId = Number(kamar);
    if (!Number.isInteger(selectedId)) return null;
    return availableRooms.find((room) => room.id_kamar === selectedId) ?? null;
  }, [availableRooms, kamar]);

  const formatCurrency = formatRupiah;

  const totalTagihan = useMemo(() => {
    const hargaPerBulan = Number(selectedRoom?.harga_bulanan) || 0;
    const durasi = Number.parseInt(durasiBulan, 10) || 0;
    return hargaPerBulan * durasi;
  }, [selectedRoom, durasiBulan]);

  const estimasiCheckOut = useMemo(() => {
    if (!tglMasuk) return "-";
    try {
      const apiDate = formatDateForApi(tglMasuk);
      const [year, month, day] = apiDate.split("-");
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (Number.isNaN(date.getTime())) return "-";

      date.setMonth(date.getMonth() + (Number.parseInt(durasiBulan, 10) || 0));
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }, [tglMasuk, durasiBulan]);

  const pickBuktiBayarImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Izin Diperlukan",
        "Izinkan akses galeri untuk memilih bukti bayar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setBuktiBayar(imageAssetToUploadFile(asset, "bukti_bayar"));
      setBuktiBayarPreview(asset.uri);
    }
  };

  const pickBuktiBayarPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const file = fileAssetToUploadFile(
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "application/pdf",
        },
        "bukti_bayar",
      );

      setBuktiBayar({
        ...file,
        name: file.name.toLowerCase().endsWith(".pdf")
          ? file.name
          : file.name + ".pdf",
        type: "application/pdf",
      });
      setBuktiBayarPreview(null);
    }
  };

  const pickBuktiBayar = async () => {
    Alert.alert(
      "Pilih Bukti Pembayaran",
      "Pilih file gambar atau PDF.",
      [
        { text: "Gambar", onPress: pickBuktiBayarImage },
        { text: "PDF", onPress: pickBuktiBayarPdf },
        { text: "Batal", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const handleSave = async () => {
    if ((await getConnectivityStatus()) === "offline") {
      Alert.alert(
        "Koneksi Diperlukan",
        "Tindakan ini membutuhkan koneksi internet.",
      );
      return;
    }
    if (
      !nama.trim() ||
      !noHp.trim() ||
      !alamatAsal.trim() ||
      !kamar ||
      !tglMasuk ||
      !durasiBulan ||
      !metodePembayaran ||
      !buktiBayar
    ) {
      Alert.alert("Error", "Semua kolom bertanda * wajib diisi.");
      return;
    }

    if (availableRooms.length === 0) {
      Alert.alert(
        "Kamar Tidak Tersedia",
        roomsError || "Muat ulang daftar kamar dari server terlebih dahulu.",
      );
      return;
    }

    const parsedKamarId = Number(kamar);
    const parsedDurasi = Number.parseInt(durasiBulan, 10) || 1;

    if (
      !Number.isInteger(parsedKamarId) ||
      parsedKamarId <= 0 ||
      !selectedRoom
    ) {
      Alert.alert("Error", "Pilih kamar dari daftar yang tersedia di server.");
      return;
    }

    if (totalTagihan <= 0) {
      Alert.alert("Error", "Total tagihan tidak valid.");
      return;
    }

    const formData = new FormData();
    formData.append("nama_lengkap", nama.trim());
    formData.append("no_hp", noHp.trim());
    formData.append("alamat_asal", alamatAsal.trim());
    formData.append("id_kamar", String(parsedKamarId));
    formData.append("tanggal_masuk", formatDateForApi(tglMasuk));
    formData.append("durasi_sewa_bulan", String(parsedDurasi));
    formData.append("metode_pembayaran", metodePembayaran);
    formData.append("bukti_bayar", buktiBayar as any);

    try {
      setIsSaving(true);
      const response = await apiClient.post<CreatePenghuniResponse>(
        "/admin/penghuni",
        formData,
      );
      const credentials = response.data.credentials;
      try {
        await Promise.all([
          markPenghuniCacheDirty(db),
          markKamarCacheDirty(db),
        ]);
        await synchronizePenghuniCache(db);
      } catch (cacheError) {
        console.error(
          "Failed to refresh caches after creating PENGHUNI:",
          cacheError,
        );
      }

      setCreatedCredentials({
        email: credentials?.email || "-",
        temporaryPassword: credentials?.temporary_password || "-",
        noHp: noHp.trim(),
        nama: nama.trim(),
      });
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { errors?: Record<string, string[]>; message?: string };
        };
        message?: string;
      };
      const validationErrors = err.response?.data?.errors;
      let errorMessage = "Gagal menyimpan penghuni ke database.";

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        errorMessage = firstError?.[0] || errorMessage;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === "Network Error") {
        errorMessage =
          "Tidak dapat terhubung ke server. Periksa URL API dan koneksi backend.";
      }

      Alert.alert("Gagal Menyimpan", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const sendCredentialsToWhatsApp = async () => {
    if (!createdCredentials) return;

    const phone = normalizeIndonesianPhone(createdCredentials.noHp);
    if (!phone) {
      Alert.alert(
        "Nomor Tidak Valid",
        "Nomor WhatsApp penyewa harus diawali 08, 62, atau +62.",
      );
      return;
    }

    const message = encodeURIComponent(
      buildCredentialMessage(createdCredentials),
    );
    const deepLink = "whatsapp://send?phone=" + phone + "&text=" + message;
    const webLink = "https://wa.me/" + phone + "?text=" + message;

    try {
      const canOpenWhatsApp = await Linking.canOpenURL(deepLink);
      await Linking.openURL(canOpenWhatsApp ? deepLink : webLink);
    } catch {
      await Linking.openURL(webLink);
    }
  };

  const finishCreatedPenghuni = () => {
    setCreatedCredentials(null);
    router.back();
  };

  return {
    nama,
    setNama,
    noHp,
    setNoHp,
    alamatAsal,
    setAlamatAsal,
    tipeKamar,
    setTipeKamar,
    kamar,
    setKamar,
    tglMasuk,
    setTglMasuk,
    durasiBulan,
    setDurasiBulan,
    metodePembayaran,
    setMetodePembayaran,
    buktiBayar,
    buktiBayarPreview,
    pickBuktiBayar,
    createdCredentials,
    sendCredentialsToWhatsApp,
    finishCreatedPenghuni,
    totalTagihan,
    estimasiCheckOut,
    formatCurrency,
    handleSave,
    handleCancel: () => router.back(),
    fetchAvailableRooms,
    roomData,
    availableTipeList,
    availableRooms,
    selectedRoom,
    isSaving,
    isLoadingRooms,
    roomsError,
  };
}
