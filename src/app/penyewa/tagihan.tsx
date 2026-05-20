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
}