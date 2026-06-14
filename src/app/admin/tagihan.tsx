import * as Linking from "expo-linking";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { invoiceApi } from "@/api/invoice";
import type { AdminTagihanStatus } from "@/api/tagihanApi";
import type {
  NotifikasiItem,
  PendingPembayaranItem,
  TagihanReminderItem,
} from "@/types/tagihan";
import { tagihanApi } from "@/api/tagihanApi";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminNotificationModal } from "@/components/tagihan/admin/AdminNotificationModal";
import { PaymentVerificationModal } from "@/components/tagihan/admin/PaymentVerificationModal";
import { PendingPaymentsList } from "@/components/tagihan/admin/PendingPaymentsList";
import { TagihanList } from "@/components/tagihan/admin/TagihanList";
import { TagihanStats } from "@/components/tagihan/admin/TagihanStats";
import {
  ADMIN_PENDING_SCOPE,
  ADMIN_TAGIHAN_SCOPE,
  markDirty,
} from "@/database/tagihanRepository";
import { syncAdminPending, syncAdminTagihan } from "@/database/tagihanSync";
import {
  useAdminPendingPayments,
  useAdminTagihanList,
} from "@/hooks/admin/useAdminTagihanPagination";
import { getConnectivityStatus } from "@/network/connectivity";
import { NotificationFacade } from "@/services/NotificationFacade";
import { PaymentFacade } from "@/services/PaymentFacade";

const STATUS_OPTIONS: { value: AdminTagihanStatus; label: string }[] = [
  { value: "semua", label: "SEMUA" },
  { value: "belum_bayar", label: "BELUM BAYAR" },
  { value: "lunas", label: "LUNAS" },
  { value: "telat", label: "TELAT" },
  { value: "dibatalkan", label: "DIBATALKAN" },
];

export default function AdminTagihanScreen() {
  const db = useSQLiteContext();
  const tagihanState = useAdminTagihanList();
  const pendingState = useAdminPendingPayments();
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [activeTab, setActiveTab] = useState<"semua" | "pending">("semua");
  const [preview, setPreview] = useState<PendingPembayaranItem | null>(null);
  const [catatan, setCatatan] = useState("");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
    number | null
  >(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await tagihanApi.getNotifications(true);
      setNotifications(data);
      if (data.length > 0) setShowNotifModal(true);
    } catch {
      // Notification failures must not block either paginated list.
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

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

  const handleRunDueDateCheck = async () => {
    if (!(await requireOnline())) return;
    try {
      setIsChecking(true);
      await NotificationFacade.runCheckAndNotify();
      await markDirty(db, "tagihan", ADMIN_TAGIHAN_SCOPE);
      await syncAdminTagihan(db, true);
      await tagihanState.reload();
      void fetchNotifications();
      Alert.alert("Berhasil", "Pengecekan jatuh tempo selesai.");
    } catch {
      Alert.alert("Gagal", "Gagal menjalankan pengecekan jatuh tempo.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleVerify = async (
    idPembayaran: number,
    action: "diterima" | "ditolak",
  ) => {
    if (!(await requireOnline())) return;
    try {
      setVerifyingId(idPembayaran);
      if (action === "diterima")
        await PaymentFacade.verifyPayment(idPembayaran, catatan);
      else await PaymentFacade.rejectPayment(idPembayaran, catatan);
      setPreview(null);
      setCatatan("");
      try {
        await Promise.all([
          markDirty(db, "tagihan", ADMIN_TAGIHAN_SCOPE),
          markDirty(db, "pending", ADMIN_PENDING_SCOPE),
        ]);
        await Promise.all([
          syncAdminTagihan(db, true),
          syncAdminPending(db, true),
        ]);
        await Promise.all([tagihanState.reload(), pendingState.reload()]);
      } catch {
        Alert.alert(
          "Pembayaran Diproses",
          "Perubahan tersimpan di server, tetapi cache lokal belum berhasil diperbarui.",
        );
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      Alert.alert("Gagal", message || "Gagal memproses pembayaran.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (!(await requireOnline())) return;
    await tagihanApi.markNotificationAsRead(id);
    setNotifications((current) => {
      const updated = current.filter((notification) => notification.id !== id);
      if (updated.length === 0) setShowNotifModal(false);
      return updated;
    });
  };

  const handleMarkAllAsRead = async () => {
    if (!(await requireOnline())) return;
    await Promise.all(
      notifications.map((notification) =>
        tagihanApi.markNotificationAsRead(notification.id),
      ),
    );
    setNotifications([]);
    setShowNotifModal(false);
  };

  const handleSendWA = async (item: TagihanReminderItem) => {
    if (!(await requireOnline())) return;
    if (item.whatsapp.enabled && item.whatsapp.url)
      Linking.openURL(item.whatsapp.url);
    else
      Alert.alert("Tidak Tersedia", "Nomor WhatsApp penyewa tidak tersedia.");
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
      await invoiceApi.downloadAdminInvoicePdf(
        paymentId,
        item.kode_invoice || "invoice",
      );
    } catch (error: unknown) {
      Alert.alert(
        "Gagal Mengunduh",
        error instanceof Error ? error.message : "Gagal mengunduh invoice PDF.",
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const activeState = activeTab === "semua" ? tagihanState : pendingState;
  const stats = {
    total: tagihanState.summary?.total ?? 0,
    lunas: tagihanState.summary?.lunas ?? 0,
    belum: tagihanState.summary?.belum ?? 0,
    pending: pendingState.meta?.total ?? 0,
  };

  const listHeader = (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#1a1a1a" }}>
            Manajemen Tagihan
          </Text>
          <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Validasi bukti bayar & cek jatuh tempo.
          </Text>
        </View>
        {notifications.length > 0 ? (
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
        ) : null}
      </View>

      <TouchableOpacity
        onPress={handleRunDueDateCheck}
        disabled={isChecking}
        style={{
          backgroundColor: isChecking ? "#93c5fd" : "#3b82f6",
          borderRadius: 14,
          padding: 14,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {isChecking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            🔄 Cek Jatuh Tempo
          </Text>
        )}
      </TouchableOpacity>

      <TagihanStats stats={stats} />
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#e5e7eb",
          borderRadius: 12,
          padding: 4,
          marginBottom: 12,
        }}
      >
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
            <Text
              style={{
                fontWeight: "800",
                fontSize: 12,
                color: activeTab === tab ? "#fff" : "#666",
              }}
            >
              {tab === "semua" ? "Semua Tagihan" : "Perlu Validasi"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={activeState.search}
        onChangeText={activeState.setSearch}
        placeholder={
          activeTab === "semua"
            ? "Cari invoice, penyewa, atau kamar..."
            : "Cari pembayaran pending..."
        }
        maxLength={100}
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 11,
          marginBottom: 12,
        }}
      />

      {activeTab === "semua" ? (
        <FlatList
          horizontal
          data={STATUS_OPTIONS}
          keyExtractor={(option) => option.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => tagihanState.setStatus(item.value)}
              style={{
                backgroundColor:
                  tagihanState.status === item.value ? "#3b82f6" : "#fff",
                borderWidth: 1,
                borderColor:
                  tagihanState.status === item.value ? "#3b82f6" : "#e5e7eb",
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 7,
              }}
            >
              <Text
                style={{
                  color: tagihanState.status === item.value ? "#fff" : "#666",
                  fontWeight: "800",
                  fontSize: 10,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : null}

      {activeState.notice ? (
        <View
          style={{
            backgroundColor: "#fffbeb",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#a16207", fontWeight: "700" }}>
            {activeState.notice}
          </Text>
        </View>
      ) : null}
      {activeState.error && activeState.items.length > 0 ? (
        <TouchableOpacity
          onPress={activeState.retry}
          style={{
            backgroundColor: "#fef2f2",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#dc2626", fontWeight: "700" }}>
            {activeState.error} Ketuk untuk mencoba lagi.
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const emptyState = activeState.initialLoading ? (
    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
  ) : activeState.error ? (
    <TouchableOpacity
      onPress={activeState.retry}
      style={{
        backgroundColor: "#fef2f2",
        borderRadius: 12,
        padding: 18,
        alignItems: "center",
      }}
    >
      <Text
        style={{ color: "#dc2626", fontWeight: "700", textAlign: "center" }}
      >
        {activeState.error}
      </Text>
      <Text style={{ color: "#dc2626", marginTop: 6 }}>
        Ketuk untuk mencoba lagi.
      </Text>
    </TouchableOpacity>
  ) : (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#888", fontWeight: "700" }}>
        {activeTab === "semua"
          ? "Tidak ada data tagihan."
          : "Tidak ada pembayaran yang perlu divalidasi."}
      </Text>
    </View>
  );

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminNotificationModal
        visible={showNotifModal}
        notifications={notifications}
        handleMarkAsRead={handleMarkAsRead}
        handleMarkAllAsRead={handleMarkAllAsRead}
        onClose={() => setShowNotifModal(false)}
      />
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

      {activeTab === "semua" ? (
        <FlatList
          style={{ flex: 1, backgroundColor: "#f5f5f5" }}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          data={tagihanState.items}
          keyExtractor={(item) => String(item.id_tagihan)}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
          ListFooterComponent={
            tagihanState.loadingMore ? (
              <ActivityIndicator
                color="#3b82f6"
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={tagihanState.refreshing}
              onRefresh={tagihanState.refresh}
            />
          }
          onEndReached={() => void tagihanState.loadMore()}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <TagihanList
              tagihan={[item]}
              handleSendWA={handleSendWA}
              downloadingInvoiceId={downloadingInvoiceId}
              onDownloadInvoice={handleDownloadInvoice}
            />
          )}
        />
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: "#f5f5f5" }}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          data={pendingState.items}
          keyExtractor={(item) => String(item.id_pembayaran)}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
          ListFooterComponent={
            pendingState.loadingMore ? (
              <ActivityIndicator
                color="#3b82f6"
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={pendingState.refreshing}
              onRefresh={pendingState.refresh}
            />
          }
          onEndReached={() => void pendingState.loadMore()}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <PendingPaymentsList
              pendingPayments={[item]}
              onInspect={(payment) => {
                setPreview(payment);
                setCatatan("");
              }}
            />
          )}
        />
      )}
    </ProtectedRoute>
  );
}
