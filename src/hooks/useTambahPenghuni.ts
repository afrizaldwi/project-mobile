import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { apiClient } from "@/api/client";
import { getKamarTersedia } from "@/api/kamarService";
import type { KamarTersedia } from "@/types/kamar";

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
        "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
};

const formatDateForApi = (value: string) => {
    if (!value) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (value.includes("/")) {
        const [month, day, year] = value.split("/");
        if (month && day && year) {
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
    }
    return value;
};

const PENGHUNI_POST_PATHS = ["/admin/penghuni", "/admin/laporan/penghuni"] as const;

export function useTambahPenghuni() {
    const router = useRouter();

    const [nama, setNama] = useState("");
    const [noHp, setNoHp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [alamatAsal, setAlamatAsal] = useState("");

    const [tipeKamar, setTipeKamar] = useState<TipeKamarGroup | null>(null);
    const [kamar, setKamar] = useState("");
    const [tglMasuk, setTglMasuk] = useState(getTodayInputDate);
    const [durasiBulan, setDurasiBulan] = useState("1");

    const [availableRooms, setAvailableRooms] = useState<KamarTersedia[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [roomsError, setRoomsError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAvailableRooms = useCallback(async () => {
        try {
            setIsLoadingRooms(true);
            setRoomsError(null);

            const rooms = await getKamarTersedia();
            setAvailableRooms(rooms);

            if (rooms.length === 0) {
                setRoomsError(
                    "Tidak ada kamar berstatus tersedia. Pastikan di menu Data Kamar ada kamar dengan status Tersedia."
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
        [roomData]
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

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);

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

    const handleSave = async () => {
        if (
            !nama.trim() ||
            !noHp.trim() ||
            !email.trim() ||
            !password.trim() ||
            !kamar ||
            !tglMasuk ||
            !durasiBulan
        ) {
            Alert.alert("Error", "Semua kolom bertanda * wajib diisi.");
            return;
        }

        if (availableRooms.length === 0) {
            Alert.alert(
                "Kamar Tidak Tersedia",
                roomsError || "Muat ulang daftar kamar dari server terlebih dahulu."
            );
            return;
        }

        const parsedKamarId = Number(kamar);
        const parsedDurasi = Number.parseInt(durasiBulan, 10) || 1;

        if (!Number.isInteger(parsedKamarId) || parsedKamarId <= 0 || !selectedRoom) {
            Alert.alert("Error", "Pilih kamar dari daftar yang tersedia di server.");
            return;
        }

        if (totalTagihan <= 0) {
            Alert.alert("Error", "Total tagihan tidak valid.");
            return;
        }

        setIsSaving(true);

        const payload = {
            nama_lengkap: nama.trim(),
            email: email.trim(),
            password,
            no_hp: noHp.trim(),
            alamat_asal: alamatAsal.trim() || null,
            id_kamar: parsedKamarId,
            tanggal_masuk: formatDateForApi(tglMasuk),
            durasi_sewa_bulan: parsedDurasi,
            harga_deal: totalTagihan,
        };

        try {
            let saved = false;
            let lastError: unknown;

            for (const path of PENGHUNI_POST_PATHS) {
                try {
                    await apiClient.post(path, payload);
                    saved = true;
                    break;
                } catch (error) {
                    lastError = error;
                    if (axios.isAxiosError(error) && error.response?.status === 404) {
                        continue;
                    }
                    throw error;
                }
            }

            if (!saved) throw lastError;

            Alert.alert("Sukses", "Penghuni baru berhasil disimpan.");
            router.back();
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { errors?: Record<string, string[]>; message?: string } };
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

    return {
        nama,
        setNama,
        noHp,
        setNoHp,
        email,
        setEmail,
        password,
        setPassword,
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
