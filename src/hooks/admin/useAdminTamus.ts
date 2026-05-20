import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { tamuService } from "@/api/tamuService";
import { Tamu } from "@/types";

export function useAdminTamus() {
    const [tamus, setTamus] = useState<Tamu[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTamus = async () => {
        try {
            const data = await tamuService.getAdminTamus();
            setTamus(data);
        } catch (error) {
            console.error("Failed to fetch tamu:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTamus();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTamus();
    };

    const handleDelete = async (id: number) => {
        try {
            await tamuService.deleteAdminTamu(id);
            Alert.alert("Sukses", "Data tamu berhasil dihapus.");
            fetchTamus();
        } catch (error: any) {
            console.error("Failed to delete tamu:", error);
            Alert.alert("Error", error.response?.data?.message || "Gagal menghapus data tamu.");
        }
    };

    return { tamus, loading, refreshing, onRefresh, handleDelete };
}
