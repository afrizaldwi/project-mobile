import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { apiClient } from "@/api/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TamuCard } from "@/components/TamuCard";
import { Tamu } from "@/types";

export default function PenyewaTamuScreen() {
    const router = useRouter();
    const [tamus, setTamus] = useState<Tamu[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTamus = async () => {
        try {
            const response = await apiClient.get<{ data: Tamu[] }>("/penyewa/tamu");
            setTamus(response.data.data);
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

    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <View className="flex-1 bg-secondary">
                <View className="px-6 py-4">
                    <Text className="text-3xl font-extrabold text-dark">Data Tamu</Text>
                    <Text className="text-sm text-gray-500">Riwayat tamu yang mengunjungi Anda</Text>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : (
                    <FlatList
                        data={tamus}
                        keyExtractor={(item) => item.id_tamu.toString()}
                        contentContainerClassName="px-6 pb-24 pt-2"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        renderItem={({ item }) => <TamuCard tamu={item} />}
                        ListEmptyComponent={
                            <View className="mt-10 items-center justify-center">
                                <Ionicons name="people-outline" size={64} color="#9ca3af" />
                                <Text className="mt-4 text-center text-gray-500">
                                    Belum ada data tamu tercatat.
                                </Text>
                            </View>
                        }
                    />
                )}

                <Pressable
                    onPress={() => router.push("/penyewa/tambah-tamu" as any)}
                    className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg elevation-xl"
                >
                    <Ionicons name="add" size={32} color="#ffffff" />
                </Pressable>
            </View>
        </ProtectedRoute>
    );
}