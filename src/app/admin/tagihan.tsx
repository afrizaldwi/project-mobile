import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { tagihanApi } from "@/api/tagihanApi";
import type { NotifikasiItem, PendingPembayaranItem, TagihanReminderItem } from "@/api/tagihanApi";

const formatRupiah = (value: string | number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getStatusConfig = (item: TagihanReminderItem) => {
    const ps = item.pembayaran_terbaru?.status_verifikasi;
    if (item.status_tagihan === "lunas" || ps === "diterima")
        return { label: "Lunas", color: "#16a34a", bg: "#f0fdf4" };
    if (ps === "pending") return { label: "Menunggu", color: "#d97706", bg: "#fffbeb" };
    if (ps === "ditolak") return { label: "Ditolak", color: "#dc2626", bg: "#fef2f2" };
    if (item.status_tagihan === "telat") return { label: "Telat", color: "#dc2626", bg: "#fef2f2" };
    return { label: "Belum Bayar", color: "#dc2626", bg: "#fef2f2" };
};

export default function AdminTagihanScreen() {
    const [tagihan, setTagihan] = useState<TagihanReminderItem[]>([]);
    const [pendingPayments, setPendingPayments] = useState<PendingPembayaranItem[]>([]);
    const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
    const [activeTab, setActiveTab] = useState<"semua" | "pending">("semua");
    const [preview, setPreview] = useState<PendingPembayaranItem | null>(null);
    const [catatan, setCatatan] = useState("");
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const stats = useMemo(() => ({
        total: tagihan.length,
        lunas: tagihan.filter((t) => t.status_tagihan === "lunas").length,
        belum: tagihan.filter((t) => t.status_tagihan !== "lunas").length,
        pending: pendingPayments.length,
    }), [tagihan, pendingPayments]);

    const fetchData = async () => {
        try {
            setErrorMessage("");
            const [tagihanData, pendingData, notifData] = await Promise.all([
                tagihanApi.getAdminTagihan(),
                tagihanApi.getPendingPayments(),
                tagihanApi.getNotifications(true),
            ]);
            setTagihan(tagihanData);
            setPendingPayments(pendingData);
            setNotifications(notifData);
            if (notifData.length > 0) setShowNotifModal(true);
        } catch {
            setErrorMessage("Gagal memuat data tagihan.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = () => { setIsRefreshing(true); fetchData(); };

    const handleRunDueDateCheck = async () => {
        try {
            setIsChecking(true);
            await tagihanApi.runDueDateCheck();
            await fetchData();
            Alert.alert("Berhasil", "Pengecekan jatuh tempo selesai.");
        } catch {
            Alert.alert("Gagal", "Gagal menjalankan pengecekan jatuh tempo.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleVerify = async (idPembayaran: number, action: "diterima" | "ditolak") => {
        try {
            setVerifyingId(idPembayaran);
            if (action === "diterima") {
                await tagihanApi.verifyPayment(idPembayaran, catatan);
            } else {
                await tagihanApi.rejectPayment(idPembayaran, catatan);
            }
            setPreview(null);
            setCatatan("");
            await fetchData();
        } catch (error: any) {
            Alert.alert("Gagal", error?.response?.data?.message || "Gagal memproses pembayaran.");
        } finally {
            setVerifyingId(null);
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

    const handleSendWA = (item: TagihanReminderItem) => {
        if (item.whatsapp.enabled && item.whatsapp.url) {
            Linking.openURL(item.whatsapp.url);
        } else {
            Alert.alert("Tidak Tersedia", "Nomor WhatsApp penyewa tidak tersedia.");
        }
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            {/* Notifikasi Modal */}
            <Modal visible={showNotifModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
                            🔔 Notifikasi Tagihan
                        </Text>
                        <Text style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                            Ada {notifications.length} notifikasi tagihan baru.
                        </Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {notifications.map((notif) => (
                                <View
                                    key={notif.id}
                                    style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#f59e0b" }}
                                >
                                    <Text style={{ fontWeight: "800", color: "#92400e", fontSize: 13 }}>{notif.judul}</Text>
                                    <Text style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>{notif.pesan}</Text>
                                    <TouchableOpacity onPress={() => handleMarkAsRead(notif.id)} style={{ alignSelf: "flex-end", marginTop: 6 }}>
                                        <Text style={{ fontSize: 12, color: "#d97706", fontWeight: "700" }}>Tandai Dibaca</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={handleMarkAllAsRead}
                            style={{ backgroundColor: "#f59e0b", borderRadius: 12, padding: 12, alignItems: "center", marginTop: 8 }}
                        >
                            <Text style={{ color: "#fff", fontWeight: "800" }}>Tandai Semua Dibaca</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowNotifModal(false)} style={{ alignItems: "center", marginTop: 12 }}>
                            <Text style={{ color: "#999", fontWeight: "700" }}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Verifikasi Pembayaran */}
            <Modal visible={!!preview} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
                        <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 16 }}>
                            Verifikasi Pembayaran
                        </Text>
                        {preview && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                                    <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>PENYEWA</Text>
                                    <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 15, marginTop: 2 }}>
                                        {preview.tagihan?.penyewa.nama_lengkap || "-"}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: "#888" }}>
                                        Kamar {preview.tagihan?.kamar.nomor_kamar || "-"}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                                    <View style={{ flex: 1, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 12 }}>
                                        <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>NOMINAL</Text>
                                        <Text style={{ fontWeight: "900", color: "#1a1a1a", marginTop: 2 }}>
                                            {formatRupiah(preview.jumlah_bayar)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 12 }}>
                                        <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>METODE</Text>
                                        <Text style={{ fontWeight: "900", color: "#1a1a1a", marginTop: 2, textTransform: "capitalize" }}>
                                            {preview.metode_pembayaran}
                                        </Text>
                                    </View>
                                </View>

                                {preview.bukti_bayar_url ? (
                                    <>
                                        <TouchableOpacity onPress={() => Linking.openURL(preview.bukti_bayar_url!.replace('localhost', '192.168.100.7'))}>
                                            {/\.(jpg|jpeg|png|webp)$/i.test(preview.bukti_bayar_url) ? (
                                                <Image
                                                    source={{ uri: preview.bukti_bayar_url.replace('localhost', '192.168.100.7') }}
                                                    style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 10 }}
                                                    resizeMode="contain"
                                                />
                                            ) : null}
                                            <View style={{ backgroundColor: "#eff6ff", borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 12 }}>
                                                <Text style={{ color: "#1d4ed8", fontWeight: "800", fontSize: 13 }}>
                                                    🔗 Buka Bukti Pembayaran
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                                        <Text style={{ color: "#d97706", fontWeight: "700", fontSize: 12 }}>
                                            Bukti pembayaran belum tersedia.
                                        </Text>
                                    </View>
                                )}

                                <TextInput
                                    value={catatan}
                                    onChangeText={setCatatan}
                                    placeholder="Catatan tambahan (opsional)..."
                                    multiline
                                    numberOfLines={3}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: "#e5e7eb",
                                        borderRadius: 12,
                                        padding: 12,
                                        fontSize: 13,
                                        color: "#1a1a1a",
                                        marginBottom: 16,
                                        textAlignVertical: "top",
                                    }}
                                />

                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => handleVerify(preview.id_pembayaran, "ditolak")}
                                        disabled={verifyingId === preview.id_pembayaran}
                                        style={{
                                            flex: 1,
                                            borderWidth: 2,
                                            borderColor: "#dc2626",
                                            borderRadius: 12,
                                            padding: 14,
                                            alignItems: "center",
                                        }}
                                    >
                                        <Text style={{ color: "#dc2626", fontWeight: "900" }}>Tolak</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleVerify(preview.id_pembayaran, "diterima")}
                                        disabled={verifyingId === preview.id_pembayaran}
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#16a34a",
                                            borderRadius: 12,
                                            padding: 14,
                                            alignItems: "center",
                                        }}
                                    >
                                        {verifyingId === preview.id_pembayaran ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={{ color: "#fff", fontWeight: "900" }}>Terima</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={() => { setPreview(null); setCatatan(""); }}
                                    style={{ alignItems: "center", marginTop: 14 }}
                                >
                                    <Text style={{ color: "#888", fontWeight: "700" }}>Batal</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
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
                                Manajemen Tagihan
                            </Text>
                            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                                Validasi bukti bayar & cek jatuh tempo.
                            </Text>
                        </View>
                        {notifications.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowNotifModal(true)}
                                style={{ backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
                            >
                                <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 12 }}>🔔 {notifications.length}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Cek Jatuh Tempo Button */}
                    <TouchableOpacity
                        onPress={handleRunDueDateCheck}
                        disabled={isChecking}
                        style={{
                            backgroundColor: isChecking ? "#93c5fd" : "#3b82f6",
                            borderRadius: 14,
                            padding: 14,
                            alignItems: "center",
                            marginBottom: 16,
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        {isChecking ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={{ color: "#fff", fontWeight: "900" }}>🔄 Cek Jatuh Tempo</Text>
                        )}
                    </TouchableOpacity>

                    {errorMessage ? (
                        <View style={{ backgroundColor: "#fef2f2", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                            <Text style={{ color: "#dc2626", fontWeight: "700" }}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    {/* Stats */}
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                        {[
                            { label: "Total", value: stats.total, color: "#3b82f6", bg: "#eff6ff" },
                            { label: "Lunas", value: stats.lunas, color: "#16a34a", bg: "#f0fdf4" },
                            { label: "Belum", value: stats.belum, color: "#dc2626", bg: "#fef2f2" },
                            { label: "Pending", value: stats.pending, color: "#d97706", bg: "#fffbeb" },
                        ].map((s) => (
                            <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 14, padding: 12, alignItems: "center" }}>
                                <Text style={{ fontSize: 22, fontWeight: "900", color: s.color }}>{s.value}</Text>
                                <Text style={{ fontSize: 10, color: s.color, fontWeight: "700" }}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Tab */}
                    <View style={{ flexDirection: "row", backgroundColor: "#e5e7eb", borderRadius: 12, padding: 4, marginBottom: 16 }}>
                        {(["semua", "pending"] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    alignItems: "center",
                                    backgroundColor: activeTab === tab ? "#3b82f6" : "transparent",
                                }}
                            >
                                <Text style={{ fontWeight: "800", fontSize: 12, color: activeTab === tab ? "#fff" : "#666" }}>
                                    {tab === "semua" ? "Semua Tagihan" : "Perlu Validasi"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
                    ) : activeTab === "semua" ? (
                        tagihan.length === 0 ? (
                            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" }}>
                                <Text style={{ color: "#888", fontWeight: "700" }}>Tidak ada data tagihan.</Text>
                            </View>
                        ) : (
                            tagihan.map((item) => {
                                const status = getStatusConfig(item);
                                return (
                                    <View
                                        key={item.id_tagihan}
                                        style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 }}
                                    >
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                            <View>
                                                <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 14 }}>
                                                    {item.penyewa.nama_lengkap || "-"}
                                                </Text>
                                                <Text style={{ fontSize: 11, color: "#888" }}>
                                                    Kamar {item.kamar.nomor_kamar || "-"} • {item.kode_invoice}
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: status.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                                <Text style={{ color: status.color, fontWeight: "800", fontSize: 10 }}>{status.label}</Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ fontWeight: "900", color: "#1a1a1a" }}>
                                                {formatRupiah(item.total_tagihan)}
                                            </Text>
                                            <Text style={{ color: "#888", fontSize: 12 }}>
                                                Jatuh tempo: {formatDate(item.tanggal_jatuh_tempo)}
                                            </Text>
                                        </View>

                                        {/* Kirim WA */}
                                        <TouchableOpacity
                                            onPress={() => handleSendWA(item)}
                                            style={{
                                                backgroundColor: item.whatsapp.enabled && item.whatsapp.url ? "#f0fdf4" : "#f5f5f5",
                                                borderRadius: 10,
                                                padding: 10,
                                                alignItems: "center",
                                                borderWidth: 1,
                                                borderColor: item.whatsapp.enabled && item.whatsapp.url ? "#86efac" : "#e5e7eb",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: item.whatsapp.enabled && item.whatsapp.url ? "#15803d" : "#9ca3af",
                                                    fontWeight: "800",
                                                    fontSize: 12,
                                                }}
                                            >
                                                {item.whatsapp.enabled && item.whatsapp.url ? "💬 Kirim WA" : "WA Tidak Tersedia"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )
                    ) : (
                        pendingPayments.length === 0 ? (
                            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" }}>
                                <Text style={{ color: "#888", fontWeight: "700" }}>Tidak ada pembayaran yang perlu divalidasi.</Text>
                            </View>
                        ) : (
                            pendingPayments.map((payment) => (
                                <View
                                    key={payment.id_pembayaran}
                                    style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 }}
                                >
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                        <View>
                                            <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 14 }}>
                                                {payment.tagihan?.penyewa.nama_lengkap || "-"}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: "#888" }}>
                                                Kamar {payment.tagihan?.kamar.nomor_kamar || "-"}
                                            </Text>
                                        </View>
                                        <View style={{ backgroundColor: "#fffbeb", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                            <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 10 }}>Pending</Text>
                                        </View>
                                    </View>

                                    <Text style={{ fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
                                        {formatRupiah(payment.jumlah_bayar)}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: "#888", marginBottom: 10, textTransform: "capitalize" }}>
                                        {payment.metode_pembayaran} • {formatDate(payment.tanggal_bayar)}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => { setPreview(payment); setCatatan(""); }}
                                        style={{ backgroundColor: "#fffbeb", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#fde68a" }}
                                    >
                                        <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 13 }}>🔍 Periksa & Verifikasi</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )
                    )}
                </View>
            </ScrollView>
        </ProtectedRoute>
    );
}