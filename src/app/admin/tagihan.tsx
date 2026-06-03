import * as Linking from "expo-linking";
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

import { invoiceApi } from "@/api/invoice";
import type { NotifikasiItem, PendingPembayaranItem, TagihanReminderItem } from "@/api/tagihanApi";
import { tagihanApi } from "@/api/tagihanApi";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationFacade } from "@/services/NotificationFacade";
import { PaymentFacade } from "@/services/PaymentFacade";

// Import modular components
import { AdminNotificationModal } from "@/components/tagihan/admin/AdminNotificationModal";
import { PaymentVerificationModal } from "@/components/tagihan/admin/PaymentVerificationModal";
import { PendingPaymentsList } from "@/components/tagihan/admin/PendingPaymentsList";
import { TagihanList } from "@/components/tagihan/admin/TagihanList";
import { TagihanStats } from "@/components/tagihan/admin/TagihanStats";

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
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
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
            await NotificationFacade.runCheckAndNotify();
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
                await PaymentFacade.verifyPayment(idPembayaran, catatan);
            } else {
                await PaymentFacade.rejectPayment(idPembayaran, catatan);
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

    const handleDownloadInvoice = async (item: TagihanReminderItem) => {
        const paymentId = item.pembayaran_terbaru?.id_pembayaran;
        if (!paymentId) {
            Alert.alert("Invoice Belum Tersedia", "Data pembayaran untuk invoice ini belum tersedia.");
            return;
        }

        try {
            setDownloadingInvoiceId(paymentId);
            await invoiceApi.downloadAdminInvoicePdf(paymentId, item.kode_invoice || "invoice");
        } catch (error: any) {
            Alert.alert("Gagal Mengunduh", error?.message || "Gagal mengunduh invoice PDF.");
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            {/* Modular Notification Modal */}
            <AdminNotificationModal
                visible={showNotifModal}
                notifications={notifications}
                handleMarkAsRead={handleMarkAsRead}
                handleMarkAllAsRead={handleMarkAllAsRead}
                onClose={() => setShowNotifModal(false)}
            />

            {/* Modular Payment Verification Modal */}
            <PaymentVerificationModal
                visible={!!preview}
                preview={preview}
                catatan={catatan}
                setCatatan={setCatatan}
                verifyingId={verifyingId}
                handleVerify={handleVerify}
                onClose={() => {
                    setPreview(null);
                    setCatatan("");
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

                    {/* Modular Stats Component */}
                    <TagihanStats stats={stats} />

                    {/* Tab Navigation */}
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
                        /* Modular Tagihan List */
                        <TagihanList
                            tagihan={tagihan}
                            handleSendWA={handleSendWA}
                            downloadingInvoiceId={downloadingInvoiceId}
                            onDownloadInvoice={handleDownloadInvoice}
                        />
                    ) : (
                        /* Modular Pending Payments List */
                        <PendingPaymentsList
                            pendingPayments={pendingPayments}
                            onInspect={(payment: PendingPembayaranItem) => {
                                setPreview(payment);
                                setCatatan("");
                            }}
                        />
                    )}
                </View>
            </ScrollView>
        </ProtectedRoute>
    );
}