import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";

import { AdminTamuList } from "@/components/admin/tamu/AdminTamuList";
import { FloatingAddButton } from "@/components/common/FloatingAddButton";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAdminTamus } from "@/hooks/admin/useAdminTamus";

export default function AdminTamuScreen() {
    const router = useRouter();
    const {
        tamus, loading, refreshing, loadingMore, error, summary, syncing, notice, lastSyncedAt,
        connectivity, searchInput, setSearchInput, onRefresh, loadMore, retry, handleDelete,
    } = useAdminTamus();
    const cacheStatus = syncing
        ? "Menyinkronkan data TAMU..."
        : notice ?? (lastSyncedAt ? `Terakhir disinkronkan: ${new Date(lastSyncedAt).toLocaleString("id-ID")}` : null);

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScreenHeader title="Data Tamu" subtitle="Kelola riwayat tamu seluruh penghuni" />
                <View className="mx-6 mb-3 flex-row items-center rounded-xl bg-white px-3" style={{ elevation: 1 }}>
                    <Ionicons name="search-outline" size={18} color="#9ca3af" />
                    <TextInput
                        placeholder="Cari tamu, penghuni, kamar, atau keperluan..."
                        placeholderTextColor="#9ca3af"
                        value={searchInput}
                        onChangeText={setSearchInput}
                        maxLength={100}
                        className="ml-2 flex-1 py-3 text-sm text-dark"
                    />
                </View>
                <View className="mx-6 mb-3 flex-row gap-2">
                    {[
                        { label: "Total", value: summary.total_tamu },
                        { label: "Penghuni", value: summary.total_penghuni_visited },
                        { label: "Hari Ini", value: summary.tamu_today },
                    ].map((item) => (
                        <View key={item.label} className="flex-1 rounded-xl bg-white p-3" style={{ elevation: 1 }}>
                            <Text className="text-[10px] font-semibold uppercase text-gray-500">{item.label}</Text>
                            <Text className="text-xl font-extrabold text-primary">{item.value}</Text>
                        </View>
                    ))}
                </View>
                {cacheStatus ? (
                    <View className="mx-6 mb-3 flex-row items-center justify-center rounded-xl bg-blue-50 px-3 py-2">
                        {syncing ? <ActivityIndicator size="small" color="#2563eb" /> : null}
                        <Text className={`${syncing ? "ml-2" : ""} text-center text-[10px] font-semibold text-blue-700`}>
                            {cacheStatus}
                        </Text>
                    </View>
                ) : null}
                <AdminTamuList
                    loading={loading}
                    refreshing={refreshing}
                    loadingMore={loadingMore}
                    error={error}
                    tamus={tamus}
                    onRefresh={onRefresh}
                    onLoadMore={loadMore}
                    onRetry={retry}
                    onDelete={handleDelete}
                />
                <FloatingAddButton onPress={() => {
                    if (connectivity === "offline") {
                        Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet.");
                        return;
                    }
                    router.push("/admin/tambah-tamu" as any);
                }} />
            </View>
        </ProtectedRoute>
    );
}
