import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { apiClient } from "@/api/client";
import { KeluhanCard } from "@/components/KeluhanCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Keluhan } from "@/types";

export default function PenyewaKeluhanScreen() {
    const router = useRouter();
    const [keluhans, setKeluhans] = useState<Keluhan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchKeluhans = async () => {
        try {
            const response = await apiClient.get<{ data: Keluhan[] }>("/penyewa/keluhan");
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

    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <View className="flex-1 bg-secondary">
                <View className="px-6 py-4">
                    <Text className="text-3xl font-extrabold text-dark">Daftar Keluhan</Text>
                    <Text className="text-sm text-gray-500">Keluhan yang Anda laporkan</Text>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : (
                    <FlatList
                        data={keluhans}
                        keyExtractor={(item) => item.id_keluhan.toString()}
                        contentContainerClassName="px-4 pb-24 pt-2"
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: "space-between" }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        renderItem={({ item }) => <KeluhanCard keluhan={item} />}
                        ListEmptyComponent={
                            <View className="mt-10 items-center justify-center">
                                <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
                                <Text className="mt-4 text-center text-gray-500">
                                    Belum ada keluhan yang dilaporkan.
                                </Text>
                            </View>
                        }
                    />
                )}

                <Pressable
                    onPress={() => router.push("/penyewa/tambah-keluhan" as any)}
                    className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg elevation-xl"
                >
                    <Ionicons name="add" size={32} color="#ffffff" />
                </Pressable>
            </View>
        </ProtectedRoute>
    );
}