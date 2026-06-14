import React from "react";
import { View } from "react-native";

import { AdminKeluhanList } from "@/components/admin/keluhan/AdminKeluhanList";
import { KeluhanStatusFilter } from "@/components/admin/keluhan/KeluhanStatusFilter";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAdminKeluhans } from "@/hooks/admin/useAdminKeluhans";

export default function AdminKeluhanScreen() {
    const {
        loading,
        refreshing,
        loadingMore,
        error,
        notice,
        filter,
        setFilter,
        keluhans,
        onRefresh,
        loadMore,
        retry,
        handleDelete,
        handleUpdateStatus,
    } = useAdminKeluhans();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScreenHeader
                    title="Data Keluhan"
                    subtitle="Kelola semua laporan keluhan penyewa"
                />
                <KeluhanStatusFilter filter={filter} onFilterChange={setFilter} />
                <AdminKeluhanList
                    loading={loading}
                    refreshing={refreshing}
                    loadingMore={loadingMore}
                    error={error}
                    notice={notice}
                    keluhans={keluhans}
                    onRefresh={onRefresh}
                    onLoadMore={loadMore}
                    onRetry={retry}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                />
            </View>
        </ProtectedRoute>
    );
}
