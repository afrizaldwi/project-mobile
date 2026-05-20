import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router"; // (Assuming useRouter isn't needed here currently, but expo-router is where useFocusEffect comes from)
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { apiClient } from "@/api/client";
import { KeluhanCard } from "@/components/KeluhanCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Keluhan } from "@/types";

type FilterStatus = "semua" | "pending" | "proses" | "selesai";

export default function AdminKeluhanScreen() {
    const [keluhans, setKeluhans] = useState<Keluhan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterStatus>("semua");

    const fetchKeluhans = async () => {
        try {
            const response = await apiClient.get<{ data: Keluhan[] }>("/admin/keluhan");
            setKeluhans(response.data.data);
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
            await apiClient.delete(`/admin/keluhan/${id}`);
            Alert.alert("Sukses", "Data keluhan berhasil dihapus.");
            fetchKeluhans();
        } catch (error: any) {
            console.error("Failed to delete keluhan:", error);
            Alert.alert("Error", error.response?.data?.message || "Gagal menghapus keluhan.");
        }
    };

    const handleUpdateStatus = async (id: number, status: "pending" | "proses" | "selesai") => {
        try {
            await apiClient.patch(`/admin/keluhan/${id}/status`, {
                status_keluhan: status,
            });
            Alert.alert("Sukses", "Status keluhan berhasil diperbarui.");
            fetchKeluhans();
        } catch (error: any) {
            console.error("Failed to update status keluhan:", error);
            Alert.alert("Error", error.response?.data?.message || "Gagal memperbarui status.");
        }
    };

    const filteredKeluhans = filter === "semua"
        ? keluhans
        : keluhans.filter((k) => k.status_keluhan === filter);

    const FilterButton = ({ status, label }: { status: FilterStatus; label: string }) => {
        const isActive = filter === status;
        return (
            <Pressable
                onPress={() => setFilter(status)}
                className={`mr-2 rounded-full px-4 py-2 ${
                    isActive ? "bg-primary" : "bg-white border border-gray-200"
                }`}
            >
                <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-600"}`}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <View className="px-6 py-4">
                    <Text className="text-3xl font-extrabold text-dark">Data Keluhan</Text>
                    <Text className="text-sm text-gray-500">Kelola semua laporan keluhan penyewa</Text>
                </View>

                <View className="px-6 pb-2">
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[
                            { status: "semua", label: "Semua" },
                            { status: "pending", label: "Pending" },
                            { status: "proses", label: "Proses" },
                            { status: "selesai", label: "Selesai" },
                        ]}
                        keyExtractor={(item) => item.status}
                        renderItem={({ item }) => (
                            <FilterButton status={item.status as FilterStatus} label={item.label} />
                        )}
                    />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredKeluhans}
                        keyExtractor={(item) => item.id_keluhan.toString()}
                        contentContainerClassName="px-4 pb-6 pt-4"
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: "space-between" }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        renderItem={({ item }) => (
                            <KeluhanCard
                                keluhan={item}
                                isAdmin={true}
                                onDelete={handleDelete}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        )}
                        ListEmptyComponent={
                            <View className="mt-10 items-center justify-center">
                                <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
                                <Text className="mt-4 text-center text-gray-500">
                                    Tidak ada keluhan ditemukan untuk status ini.
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ProtectedRoute>
    );
}