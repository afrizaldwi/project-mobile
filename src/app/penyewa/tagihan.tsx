<<<<<<< HEAD
// src/app/penyewa/tagihan.tsx
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { invoiceApi, type InvoiceItem } from "@/api/invoice";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PenyewaSummaryBanner } from "@/components/invoice/PenyewaSummaryBanner";
import { PenyewaInvoiceCard } from "@/components/invoice/PenyewaInvoiceCard";

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PenyewaTagihanScreen() {
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const totalPaid = useMemo(
        () => invoices.reduce((total, inv) => total + Number(inv.jumlah_bayar || 0), 0),
        [invoices]
    );

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const data = await invoiceApi.getPenyewaInvoices();
            setInvoices(data);
        } catch {
            setErrorMessage("Gagal memuat data tagihan.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleDownloadPdf = async (invoice: InvoiceItem) => {
        try {
            setDownloadingId(invoice.id_pembayaran);
            await invoiceApi.downloadPenyewaInvoicePdf(
                invoice.id_pembayaran,
                invoice.kode_invoice ?? "invoice"
            );
        } catch {
            Alert.alert("Gagal", "Tidak bisa download PDF. Coba lagi.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <ScrollView
                className="flex-1 bg-secondary"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-5">
                    <Text className="text-2xl font-black text-dark">Tagihan Saya</Text>
                    <Text className="text-sm font-medium text-dark/50 mt-1">
                        Lihat riwayat pembayaran dan download invoice kost.
                    </Text>
                </View>

                {/* Error */}
                {errorMessage ? (
                    <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <Text className="text-sm font-semibold text-red-600">{errorMessage}</Text>
                    </View>
                ) : null}

                {/* Summary */}
                {!isLoading && (
                    <PenyewaSummaryBanner totalInvoice={invoices.length} totalPaid={totalPaid} />
                )}

                {/* Section Header */}
                <View className="mb-3">
                    <Text className="text-lg font-black text-dark">Riwayat Pembayaran</Text>
                    <Text className="text-xs font-medium text-dark/40">
                        Invoice tersedia setelah pembayaran diterima admin.
                    </Text>
                </View>

                {/* List */}
                {isLoading ? (
                    <View className="items-center py-12">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="mt-3 text-sm font-medium text-dark/50">
                            Memuat data tagihan...
                        </Text>
                    </View>
                ) : invoices.length === 0 ? (
                    <View className="items-center rounded-2xl bg-white py-12 border border-gray-100 shadow-sm">
                        <Text className="text-4xl mb-3">✅</Text>
                        <Text className="font-black text-dark">Belum ada invoice</Text>
                        <Text className="mt-1 text-sm font-medium text-dark/50 text-center px-6">
                            Invoice akan muncul setelah pembayaran kamu diterima admin.
                        </Text>
                    </View>
                ) : (
                    invoices.map((invoice) => (
                        <PenyewaInvoiceCard
                            key={invoice.id_pembayaran}
                            invoice={invoice}
                            isDownloading={downloadingId === invoice.id_pembayaran}
                            onDownload={() => handleDownloadPdf(invoice)}
                        />
                    ))
                )}
            </ScrollView>
        </ProtectedRoute>
    );
=======
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { tagihanApi } from "@/api/tagihanApi";
import type { NotifikasiItem, TagihanReminderItem } from "@/api/tagihanApi";
import { PaymentFacade } from "@/services/PaymentFacade";

// Import modular components
import { ActiveTagihanCard } from "@/components/tagihan/penyewa/ActiveTagihanCard";
import { RiwayatPembayaranList } from "@/components/tagihan/penyewa/RiwayatPembayaranList";
import { PaymentUploadModal } from "@/components/tagihan/penyewa/PaymentUploadModal";
import { TenantNotificationModal } from "@/components/tagihan/penyewa/TenantNotificationModal";

export default function PenyewaTagihanScreen() {
  const [tagihan, setTagihan] = useState<TagihanReminderItem[]>([]);
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [selected, setSelected] = useState<TagihanReminderItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [metode, setMetode] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeTagihan = useMemo(
    () => tagihan.filter((item) => item.status_tagihan !== "lunas"),
    [tagihan]
  );
  const riwayat = useMemo(
    () => tagihan.filter((item) => item.status_tagihan === "lunas"),
    [tagihan]
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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Diperlukan", "Izinkan akses galeri untuk upload bukti bayar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!selected) return;
    if (!metode || !imageUri) {
      Alert.alert("Lengkapi Data", "Pilih metode pembayaran dan bukti bayar.");
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("metode_pembayaran", metode);
      // @ts-ignore
      formData.append("bukti_bayar", {
        uri: imageUri,
        name: "bukti_bayar.jpg",
        type: "image/jpeg",
      });
      await PaymentFacade.uploadProof(selected.id_tagihan, formData);
      Alert.alert("Berhasil", "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.");
      setShowPaymentModal(false);
      setSelected(null);
      setMetode("");
      setImageUri(null);
      fetchData();
    } catch (error: any) {
      const msg =
        error?.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join("\n")
          : error?.response?.data?.message || "Gagal mengirim bukti pembayaran.";
      Alert.alert("Gagal", msg);
    } finally {
      setIsUploading(false);
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
      {/* Modular Tenant Notification Modal */}
      <TenantNotificationModal
        visible={showNotifModal}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        handleMarkAllAsRead={handleMarkAllAsRead}
        onClose={() => setShowNotifModal(false)}
      />

      {/* Modular Payment Upload Modal */}
      <PaymentUploadModal
        visible={showPaymentModal}
        selectedTagihan={selected}
        metode={metode}
        setMetode={setMetode}
        imageUri={imageUri}
        handlePickImage={handlePickImage}
        handleUpload={handleUpload}
        isUploading={isUploading}
        onClose={() => {
          setShowPaymentModal(false);
          setImageUri(null);
          setMetode("");
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "#f5f5f5" }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
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
                  🔔 {notifications.length}
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
              {/* Tagihan Aktif */}
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
                Tagihan Aktif
              </Text>
              <Text style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                Tagihan yang belum lunas atau sedang menunggu verifikasi.
              </Text>

              {activeTagihan.length === 0 ? (
                <View style={{ backgroundColor: "#f0fdf4", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 20 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
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
                    onPay={(selectedItem) => {
                      setSelected(selectedItem);
                      setShowPaymentModal(true);
                      setMetode("");
                      setImageUri(null);
                    }}
                  />
                ))
              )}

              {/* Modular Riwayat Pembayaran List */}
              <RiwayatPembayaranList riwayat={riwayat} />
            </>
          )}
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
>>>>>>> origin/riyana/tagihan-pembayaran-verifikasi
}