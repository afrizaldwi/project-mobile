import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { invoiceApi } from "@/api/invoice";
import type { NotifikasiItem, TagihanReminderItem } from "@/types/tagihan";
import { tagihanApi } from "@/api/tagihanApi";
import { useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getLocalPenyewaTagihan,
  hasSnapshot,
  markDirty,
} from "@/database/tagihanRepository";
import { syncPenyewaTagihan } from "@/database/tagihanSync";
import { getConnectivityStatus } from "@/network/connectivity";
import { PaymentFacade } from "@/services/PaymentFacade";
import {
  fileAssetToUploadFile,
  imageAssetToUploadFile,
  type UploadFilePayload,
} from "@/utils/uploadFile";
import { isPaidOrVerified } from "@/utils/tagihanHelpers";

import { ActiveTagihanCard } from "@/components/tagihan/penyewa/ActiveTagihanCard";
import { PaymentUploadModal } from "@/components/tagihan/penyewa/PaymentUploadModal";
import { RiwayatPembayaranList } from "@/components/tagihan/penyewa/RiwayatPembayaranList";
import { TenantNotificationModal } from "@/components/tagihan/penyewa/TenantNotificationModal";

export default function PenyewaTagihanScreen() {
  const db = useSQLiteContext();
  const { user } = useAuth();
  const scope = user ? `penyewa:${user.id}` : null;
  const [tagihan, setTagihan] = useState<TagihanReminderItem[]>([]);
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [selected, setSelected] = useState<TagihanReminderItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [metode, setMetode] = useState("");
  const [proofFile, setProofFile] = useState<UploadFilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
    number | null
  >(null);

  const activeTagihan = useMemo(
    () => tagihan.filter((item) => !isPaidOrVerified(item)),
    [tagihan],
  );
  const riwayat = useMemo(
    () => tagihan.filter((item) => isPaidOrVerified(item)),
    [tagihan],
  );

  const loadTagihan = useCallback(
    async (force = false) => {
      if (!scope) return;
      try {
        setErrorMessage("");
        const snapshot = await hasSnapshot(db, "tagihan", scope);
        if (snapshot) setTagihan(await getLocalPenyewaTagihan(db, scope));
        if ((await getConnectivityStatus()) === "offline") {
          if (!snapshot)
            setErrorMessage(
              "Offline dan belum ada tagihan tersimpan di perangkat.",
            );
          else setErrorMessage("");
          return;
        }
        await syncPenyewaTagihan(db, scope, force);
        setTagihan(await getLocalPenyewaTagihan(db, scope));
      } catch {
        setErrorMessage(
          "Sinkronisasi tagihan gagal. Cache lama tetap digunakan.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [db, scope],
  );
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await tagihanApi.getNotifications(true);
      setNotifications(data);
      if (data.length > 0) setShowNotifModal(true);
    } catch {}
  }, []);
  useEffect(() => {
    void loadTagihan();
    void fetchNotifications();
  }, [fetchNotifications, loadTagihan]);
  const onRefresh = () => {
    setIsRefreshing(true);
    void loadTagihan(true);
    void fetchNotifications();
  };

  const handlePickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin Diperlukan",
        "Izinkan akses galeri untuk upload bukti bayar.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setProofFile(imageAssetToUploadFile(result.assets[0], "bukti_bayar"));
    }
  };

  const handlePickProofPdf = async () => {
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

      setProofFile({
        ...file,
        name: file.name.toLowerCase().endsWith(".pdf")
          ? file.name
          : file.name + ".pdf",
        type: "application/pdf",
      });
    }
  };

  const handlePickImage = async () => {
    Alert.alert(
      "Pilih Bukti Pembayaran",
      "Pilih file gambar atau PDF.",
      [
        { text: "Gambar", onPress: handlePickProofImage },
        { text: "PDF", onPress: handlePickProofPdf },
        { text: "Batal", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const requireOnline = async () => {
    if ((await getConnectivityStatus()) === "offline") {
      Alert.alert(
        "Koneksi Diperlukan",
        "Tindakan ini membutuhkan koneksi internet.",
      );
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!(await requireOnline())) return;
    if (!selected) return;
    if (!metode || !proofFile) {
      Alert.alert("Lengkapi Data", "Pilih metode pembayaran dan bukti bayar.");
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("metode_pembayaran", metode);
      formData.append("bukti_bayar", proofFile as any);
      await PaymentFacade.uploadProof(selected.id_tagihan, formData);
      Alert.alert(
        "Berhasil",
        "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.",
      );
      setShowPaymentModal(false);
      setSelected(null);
      setMetode("");
      setProofFile(null);
      if (scope) {
        await markDirty(db, "tagihan", scope);
        try {
          await syncPenyewaTagihan(db, scope, true);
          setTagihan(await getLocalPenyewaTagihan(db, scope));
        } catch {
          setErrorMessage(
            "Pembayaran berhasil dikirim, tetapi cache tagihan belum diperbarui.",
          );
        }
      }
    } catch (error: any) {
      const msg = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join("\n")
        : error?.response?.data?.message || "Gagal mengirim bukti pembayaran.";
      Alert.alert("Gagal", msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadInvoice = async (item: TagihanReminderItem) => {
    if (!(await requireOnline())) return;
    const paymentId = item.pembayaran_terbaru?.id_pembayaran;
    if (!paymentId) {
      Alert.alert(
        "Invoice Belum Tersedia",
        "Data pembayaran untuk invoice ini belum tersedia.",
      );
      return;
    }
    try {
      setDownloadingInvoiceId(paymentId);
      await invoiceApi.downloadPenyewaInvoicePdf(
        paymentId,
        item.kode_invoice || "invoice",
      );
    } catch (error: any) {
      Alert.alert(
        "Gagal Mengunduh",
        error?.message || "Gagal mengunduh invoice PDF.",
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (!(await requireOnline())) return;
    await tagihanApi.markNotificationAsRead(id);
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      if (updated.length === 0) setShowNotifModal(false);
      return updated;
    });
  };

  const handleMarkAllAsRead = async () => {
    if (!(await requireOnline())) return;
    await Promise.all(
      notifications.map((n) => tagihanApi.markNotificationAsRead(n.id)),
    );
    setNotifications([]);
    setShowNotifModal(false);
  };

  return (
    <ProtectedRoute allowedRoles={["penyewa"]}>
      <TenantNotificationModal
        visible={showNotifModal}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        handleMarkAllAsRead={handleMarkAllAsRead}
        onClose={() => setShowNotifModal(false)}
      />

      <PaymentUploadModal
        visible={showPaymentModal}
        selectedTagihan={selected}
        metode={metode}
        setMetode={setMetode}
        imageUri={
          proofFile?.type === "application/pdf"
            ? null
            : (proofFile?.uri ?? null)
        }
        fileName={proofFile?.name ?? null}
        handlePickImage={handlePickImage}
        handleUpload={handleUpload}
        isUploading={isUploading}
        onClose={() => {
          setShowPaymentModal(false);
          setProofFile(null);
          setMetode("");
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "#f5f5f5" }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View>
              <Text
                style={{ fontSize: 22, fontWeight: "900", color: "#1a1a1a" }}
              >
                Tagihan Saya
              </Text>
              <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                Lihat dan bayar tagihan kost kamu.
              </Text>
            </View>
            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowNotifModal(true)}
                style={{
                  backgroundColor: "#fffbeb",
                  borderWidth: 1,
                  borderColor: "#fde68a",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{ color: "#d97706", fontWeight: "800", fontSize: 12 }}
                >
                  Notifikasi {notifications.length}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {errorMessage ? (
            <View
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#dc2626", fontWeight: "700" }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#3b82f6"
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "900",
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Tagihan Aktif
              </Text>
              <Text style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                Tagihan yang belum lunas atau sedang menunggu verifikasi.
              </Text>

              {activeTagihan.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: 16,
                    padding: 24,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "900",
                      color: "#15803d",
                      fontSize: 15,
                    }}
                  >
                    Semua tagihan sudah beres!
                  </Text>
                  <Text
                    style={{ color: "#166534", fontSize: 12, marginTop: 4 }}
                  >
                    Terima kasih telah membayar tepat waktu.
                  </Text>
                </View>
              ) : (
                activeTagihan.map((item) => (
                  <ActiveTagihanCard
                    key={item.id_tagihan}
                    item={item}
                    onPay={(selectedItem: TagihanReminderItem) => {
                      setSelected(selectedItem);
                      setShowPaymentModal(true);
                      setMetode("");
                      setProofFile(null);
                    }}
                  />
                ))
              )}

              <RiwayatPembayaranList
                riwayat={riwayat}
                downloadingInvoiceId={downloadingInvoiceId}
                onDownloadInvoice={handleDownloadInvoice}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
}
