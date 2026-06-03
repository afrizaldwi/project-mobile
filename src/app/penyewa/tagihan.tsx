import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
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
import type { NotifikasiItem, TagihanReminderItem } from "@/api/tagihanApi";
import { tagihanApi } from "@/api/tagihanApi";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PaymentFacade } from "@/services/PaymentFacade";
import { fileAssetToUploadFile, imageAssetToUploadFile, type UploadFilePayload } from "@/utils/uploadFile";

import { ActiveTagihanCard } from "@/components/tagihan/penyewa/ActiveTagihanCard";
import { PaymentUploadModal } from "@/components/tagihan/penyewa/PaymentUploadModal";
import { RiwayatPembayaranList } from "@/components/tagihan/penyewa/RiwayatPembayaranList";
import { TenantNotificationModal } from "@/components/tagihan/penyewa/TenantNotificationModal";

export default function PenyewaTagihanScreen() {
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
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);

  const isPaidOrVerified = useCallback((item: TagihanReminderItem) =>
    item.status_tagihan === "lunas" || item.pembayaran_terbaru?.status_verifikasi === "diterima", []);

  const activeTagihan = useMemo(
    () => tagihan.filter((item) => !isPaidOrVerified(item)),
    [tagihan, isPaidOrVerified]
  );
  const riwayat = useMemo(
    () => tagihan.filter((item) => isPaidOrVerified(item)),
    [tagihan, isPaidOrVerified]
  );

  const fetchData = async () => {
    try {
      setErrorMessage("");
      const [tagihanData, notifData] = await Promise.all([
        tagihanApi.getPenyewaTagihan(),
        tagihanApi.getNotifications(true),
      ]);
      setTagihan(tagihanData);
      setNotifications(notifData);
      if (notifData.length > 0) setShowNotifModal(true);
    } catch {
      setErrorMessage("Gagal memuat tagihan.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handlePickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Diperlukan", "Izinkan akses galeri untuk upload bukti bayar.");
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
        "bukti_bayar"
      );

      setProofFile({
        ...file,
        name: file.name.toLowerCase().endsWith(".pdf") ? file.name : file.name + ".pdf",
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
      { cancelable: true }
    );
  };

  const handleUpload = async () => {
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
      Alert.alert("Berhasil", "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.");
      setShowPaymentModal(false);
      setSelected(null);
      setMetode("");
      setProofFile(null);
      fetchData();
    } catch (error: any) {
      console.log(error);
      const msg =
        error?.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join("\n")
          : error?.response?.data?.message || "Gagal mengirim bukti pembayaran.";
      Alert.alert("Gagal", msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadInvoice = async (item: TagihanReminderItem) => {
    const paymentId = item.pembayaran_terbaru?.id_pembayaran;
    if (!paymentId) {
      Alert.alert("Invoice Belum Tersedia", "Data pembayaran untuk invoice ini belum tersedia.");
      return;
    }
    try {
      setDownloadingInvoiceId(paymentId);
      await invoiceApi.downloadPenyewaInvoicePdf(paymentId, item.kode_invoice || "invoice");
    } catch (error: any) {
      Alert.alert("Gagal Mengunduh", error?.message || "Gagal mengunduh invoice PDF.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await tagihanApi.markNotificationAsRead(id);
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      if (updated.length === 0) setShowNotifModal(false);
      return updated;
    });
  };

  const handleMarkAllAsRead = async () => {
    await Promise.all(notifications.map((n) => tagihanApi.markNotificationAsRead(n.id)));
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
        imageUri={proofFile?.type === "application/pdf" ? null : proofFile?.uri ?? null}
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#1a1a1a" }}>
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
                <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 12 }}>
                  Notifikasi {notifications.length}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {errorMessage ? (
            <View style={{ backgroundColor: "#fef2f2", borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: "#dc2626", fontWeight: "700" }}>{errorMessage}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
          ) : (
            <>
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
                Tagihan Aktif
              </Text>
              <Text style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                Tagihan yang belum lunas atau sedang menunggu verifikasi.
              </Text>

              {activeTagihan.length === 0 ? (
                <View style={{ backgroundColor: "#f0fdf4", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20 }}>
                  <Text style={{ fontWeight: "900", color: "#15803d", fontSize: 15 }}>
                    Semua tagihan sudah beres!
                  </Text>
                  <Text style={{ color: "#166534", fontSize: 12, marginTop: 4 }}>
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
