import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { TextInput, View } from "react-native";

import { AdminTamuList } from "@/components/admin/tamu/AdminTamuList";
import { FloatingAddButton } from "@/components/common/FloatingAddButton";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAdminTamus } from "@/hooks/admin/useAdminTamus";

export default function AdminTamuScreen() {
    const router = useRouter();
    const {
        tamus,
        loading,
        refreshing,
        loadingMore,
        error,
        searchInput,
        setSearchInput,
        onRefresh,
        loadMore,
        retry,
        handleDelete,
    } = useAdminTamus();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScreenHeader
                    title="Data Tamu"
                    subtitle="Kelola riwayat tamu seluruh penghuni"
                />
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
                <FloatingAddButton onPress={() => router.push("/admin/tambah-tamu" as any)} />
            </View>
        </ProtectedRoute>
    );
}
