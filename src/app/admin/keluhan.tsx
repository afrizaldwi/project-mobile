import React from "react";
import { View } from "react-native";

import { AdminKeluhanList } from "@/components/admin/keluhan/AdminKeluhanList";
import { KeluhanExportButtons } from "@/components/admin/keluhan/KeluhanExportButtons";
import { KeluhanStatusFilter } from "@/components/admin/keluhan/KeluhanStatusFilter";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAdminKeluhans } from "@/hooks/admin/useAdminKeluhans";

export default function AdminKeluhanScreen() {
    const {
        loading,
        refreshing,
        filter,
        setFilter,
        filteredKeluhans,
        onRefresh,
        handleDelete,
        handleUpdateStatus,
        handleExport,
        exporting,
    } = useAdminKeluhans();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScreenHeader
                    title="Data Keluhan"
                    subtitle="Kelola semua laporan keluhan penyewa"
                    right={<KeluhanExportButtons onExport={handleExport} exporting={exporting} />}
                />
                <KeluhanStatusFilter filter={filter} onFilterChange={setFilter} />
                <AdminKeluhanList
                    loading={loading}
                    refreshing={refreshing}
                    keluhans={filteredKeluhans}
                    onRefresh={onRefresh}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                />
            </View>
        </ProtectedRoute>
    );
}
