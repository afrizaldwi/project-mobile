import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { tagihanApi } from "@/api/tagihanApi";
import type { NotifikasiItem, TagihanReminderItem } from "@/api/tagihanApi";

const formatRupiah = (value: string | number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getStatusConfig = (item: TagihanReminderItem) => {
  const paymentStatus = item.pembayaran_terbaru?.status_verifikasi;
  if (item.status_tagihan === "lunas" || paymentStatus === "diterima") {
    return { label: "Lunas", color: "#16a34a", bg: "#f0fdf4" };
  }
  if (paymentStatus === "pending") {
    return { label: "Menunggu Verifikasi", color: "#d97706", bg: "#fffbeb" };
  }
  if (paymentStatus === "ditolak") {
    return { label: "Ditolak", color: "#dc2626", bg: "#fef2f2" };
  }
  if (item.status_tagihan === "telat") {
    return { label: "Telat", color: "#dc2626", bg: "#fef2f2" };
  }
  return { label: "Belum Bayar", color: "#dc2626", bg: "#fef2f2" };
};

const canPay = (item: TagihanReminderItem) => {
  if (item.status_tagihan === "lunas") return false;
  if (item.pembayaran_terbaru?.status_verifikasi === "pending") return false;
  return true;
};

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
      await tagihanApi.uploadPaymentProof(selected.id_tagihan, formData);
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

  const METODE_OPTIONS = ["Transfer Bank", "E-Wallet", "Cash"];

  return (
    <ProtectedRoute allowedRoles={["penyewa"]}>
      {/* Notifikasi H-7 Modal */}
      <Modal visible={showNotifModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
              🔔 Notifikasi Tagihan
            </Text>
            <Text style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Kamu punya {notifications.length} notifikasi tagihan.
            </Text>
            {notifications.map((notif) => (
              <View
                key={notif.id}
                style={{
                  backgroundColor: "#fffbeb",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#fde68a",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#92400e", fontSize: 13 }}>
                  {notif.judul}
                </Text>
                <Text style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>
                  {notif.pesan}
                </Text>
                <TouchableOpacity
                  onPress={() => handleMarkAsRead(notif.id)}
                  style={{ marginTop: 8, alignSelf: "flex-end" }}
                >
                  <Text style={{ fontSize: 12, color: "#d97706", fontWeight: "700" }}>
                    Tandai Dibaca
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={{
                backgroundColor: "#f59e0b",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Tandai Semua Dibaca</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowNotifModal(false)}
              style={{ alignItems: "center", marginTop: 12 }}
            >
              <Text style={{ color: "#999", fontWeight: "700" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Bayar */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 16 }}>
              Konfirmasi Bayar
            </Text>
            {selected && (
              <>
                <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: "#888", fontWeight: "700" }}>TOTAL TAGIHAN</Text>
                  <Text style={{ fontSize: 24, fontWeight: "900", color: "#1a1a1a", marginTop: 4 }}>
                    {formatRupiah(selected.total_tagihan)}
                  </Text>
                </View>

                {/* Pilih Metode */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#555", marginBottom: 8 }}>
                  Metode Pembayaran
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {METODE_OPTIONS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMetode(m.toLowerCase())}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: metode === m.toLowerCase() ? "#3b82f6" : "#e5e7eb",
                        backgroundColor: metode === m.toLowerCase() ? "#eff6ff" : "#fff",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: metode === m.toLowerCase() ? "#1d4ed8" : "#666",
                        }}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Upload Bukti */}
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: imageUri ? "#3b82f6" : "#d1d5db",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 16,
                    backgroundColor: imageUri ? "#eff6ff" : "#f9fafb",
                  }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>📎</Text>
                  <Text style={{ fontWeight: "800", color: imageUri ? "#1d4ed8" : "#374151", fontSize: 13 }}>
                    {imageUri ? "Foto terpilih ✓" : "Pilih Bukti Bayar"}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    JPG atau PNG dari galeri
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleUpload}
                  disabled={isUploading}
                  style={{
                    backgroundColor: isUploading ? "#93c5fd" : "#3b82f6",
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                      Kirim Bukti Bayar
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => {
                setShowPaymentModal(false);
                setImageUri(null);
                setMetode("");
              }}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text style={{ color: "#888", fontWeight: "700" }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                activeTagihan.map((item) => {
                  const status = getStatusConfig(item);
                  const payable = canPay(item);
                  return (
                    <View
                      key={item.id_tagihan}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      {/* Peringatan H-7 banner */}
                      {item.peringatan.aktif && (
                        <View style={{
                          backgroundColor: "#fffbeb",
                          borderRadius: 10,
                          padding: 10,
                          marginBottom: 12,
                          borderLeftWidth: 3,
                          borderLeftColor: "#f59e0b",
                        }}>
                          <Text style={{ fontWeight: "800", color: "#92400e", fontSize: 12 }}>
                            ⚠️ {item.peringatan.judul}
                          </Text>
                          {item.peringatan.hari_tersisa !== null && (
                            <Text style={{ fontSize: 11, color: "#78350f", marginTop: 2 }}>
                              {item.peringatan.hari_tersisa > 0
                                ? `Jatuh tempo dalam ${item.peringatan.hari_tersisa} hari`
                                : "Tagihan sudah melewati jatuh tempo!"}
                            </Text>
                          )}
                        </View>
                      )}

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <View>
                          <Text style={{ fontSize: 10, color: "#999", fontWeight: "700", letterSpacing: 1 }}>
                            {item.kode_invoice}
                          </Text>
                          <Text style={{ fontSize: 17, fontWeight: "900", color: "#1a1a1a", marginTop: 2 }}>
                            Kamar {item.kamar.nomor_kamar || "-"}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: status.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ color: status.color, fontWeight: "800", fontSize: 11 }}>
                            {status.label}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", backgroundColor: "#f5f5f5", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>TOTAL TAGIHAN</Text>
                          <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginTop: 2 }}>
                            {formatRupiah(item.total_tagihan)}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>JATUH TEMPO</Text>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1a1a1a", marginTop: 2 }}>
                            {formatDate(item.tanggal_jatuh_tempo)}
                          </Text>
                        </View>
                      </View>

                      {item.pembayaran_terbaru?.status_verifikasi === "ditolak" &&
                        item.pembayaran_terbaru.catatan_admin && (
                          <View style={{ backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginBottom: 12 }}>
                            <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "700" }}>
                              Catatan admin: {item.pembayaran_terbaru.catatan_admin}
                            </Text>
                          </View>
                        )}

                      <TouchableOpacity
                        disabled={!payable}
                        onPress={() => {
                          setSelected(item);
                          setShowPaymentModal(true);
                          setMetode("");
                          setImageUri(null);
                        }}
                        style={{
                          backgroundColor: payable ? "#3b82f6" : "#d1d5db",
                          borderRadius: 12,
                          padding: 14,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
                          {item.pembayaran_terbaru?.status_verifikasi === "pending"
                            ? "⏳ Menunggu Verifikasi"
                            : "💳 Bayar Sekarang"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {/* Riwayat Pembayaran */}
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#1a1a1a", marginTop: 8, marginBottom: 4 }}>
                Riwayat Pembayaran
              </Text>
              <Text style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                Daftar tagihan yang sudah lunas.
              </Text>

              {riwayat.length === 0 ? (
                <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#888", fontWeight: "700" }}>Belum ada riwayat pembayaran.</Text>
                </View>
              ) : (
                riwayat.map((item) => (
                  <View
                    key={item.id_tagihan}
                    style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <View>
                      <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 13 }}>{item.kode_invoice}</Text>
                      <Text style={{ fontSize: 11, color: "#888" }}>Kamar {item.kamar.nomor_kamar}</Text>
                      <Text style={{ fontSize: 11, color: "#888" }}>{formatDate(item.tanggal_jatuh_tempo)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 13 }}>
                        {formatRupiah(item.total_tagihan)}
                      </Text>
                      <View style={{ backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 }}>
                        <Text style={{ color: "#16a34a", fontWeight: "800", fontSize: 10 }}>Lunas</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
}