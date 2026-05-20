import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { keluhanService } from "@/api/keluhanService";
import { Keluhan } from "@/types";

export type KeluhanFilterStatus = "semua" | "pending" | "proses" | "selesai";

export function useAdminKeluhans() {
    const [keluhans, setKeluhans] = useState<Keluhan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<KeluhanFilterStatus>("semua");
    const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

    const fetchKeluhans = async () => {
        try {
            const data = await keluhanService.getAdminKeluhans();
            setKeluhans(data);
        } catch (error) {
            console.error("Failed to fetch keluhan:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchKeluhans();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchKeluhans();
    };

    const handleDelete = async (id: number) => {
        try {
            await keluhanService.deleteAdminKeluhan(id);
            Alert.alert("Sukses", "Data keluhan berhasil dihapus.");
            fetchKeluhans();
        } catch (error: any) {
            console.error("Failed to delete keluhan:", error);
            Alert.alert("Error", error.response?.data?.message || "Gagal menghapus keluhan.");
        }
    };

    const handleUpdateStatus = async (id: number, status: "pending" | "proses" | "selesai") => {
        try {
            await keluhanService.updateStatusKeluhan(id, { status_keluhan: status });
            Alert.alert("Sukses", "Status keluhan berhasil diperbarui.");
            fetchKeluhans();
        } catch (error: any) {
            console.error("Failed to update status keluhan:", error);
            Alert.alert("Error", error.response?.data?.message || "Gagal memperbarui status.");
        }
    };

    const handleExport = async (format: "csv" | "json") => {
        try {
            setExporting(format);
            await keluhanService.exportAdminKeluhans({ format, status: filter });
        } catch (error: any) {
            console.error("Failed to export:", error);
            Alert.alert(
                "Error",
                error?.message || "Gagal mengunduh laporan. Pastikan backend berjalan dan Anda sudah login."
            );
        } finally {
            setExporting(null);
        }
    };

    const filteredKeluhans = useMemo(
        () => (filter === "semua" ? keluhans : keluhans.filter((k) => k.status_keluhan === filter)),
        [keluhans, filter]
    );

    return {
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
    };
}
