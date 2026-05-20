import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { AdminTamuList } from "@/components/admin/tamu/AdminTamuList";
import { FloatingAddButton } from "@/components/common/FloatingAddButton";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAdminTamus } from "@/hooks/admin/useAdminTamus";

export default function AdminTamuScreen() {
    const router = useRouter();
    const { tamus, loading, refreshing, onRefresh, handleDelete } = useAdminTamus();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScreenHeader
                    title="Data Tamu"
                    subtitle="Kelola riwayat tamu seluruh penghuni"
                />
                <AdminTamuList
                    loading={loading}
                    refreshing={refreshing}
                    tamus={tamus}
                    onRefresh={onRefresh}
                    onDelete={handleDelete}
                />
                <FloatingAddButton onPress={() => router.push("/admin/tambah-tamu" as any)} />
            </View>
        </ProtectedRoute>
    );
}
