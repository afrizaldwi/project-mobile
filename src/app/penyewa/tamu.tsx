import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TamuCard } from "@/components/TamuCard";
import { usePenyewaTamus } from "@/hooks/usePenyewaTamus";
import { getConnectivityStatus } from "@/network/connectivity";

export default function PenyewaTamuScreen() {
    const router = useRouter();
    const { tamus, loading, refreshing, error, notice, refresh } = usePenyewaTamus();

    const handleAddPress = async () => {
        const status = await getConnectivityStatus();
        if (status === "offline") {
            Alert.alert(
                "Koneksi Diperlukan",
                "Tindakan ini membutuhkan koneksi internet.",
            );
            return;
        }
        router.push("/penyewa/tambah-tamu" as any);
    };

    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <View className="flex-1 bg-secondary">
                <View className="px-6 py-4">
                    <Text className="text-3xl font-extrabold text-dark">Data Tamu</Text>
                    <Text className="text-sm text-gray-500">Riwayat tamu yang mengunjungi Anda</Text>
                </View>

                {loading && tamus.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                    </View>
                ) : (
                    <FlatList
                        data={tamus}
                        keyExtractor={(item) => item.id_tamu.toString()}
                        contentContainerClassName="px-6 pb-24 pt-2"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                        }
                        renderItem={({ item }) => <TamuCard tamu={item} />}
                        ListHeaderComponent={
                            error || notice ? (
                                <View
                                    className={`mb-4 rounded-xl px-4 py-3 ${
                                        error
                                            ? "border border-red-200 bg-red-50"
                                            : "border border-amber-200 bg-amber-50"
                                    }`}
                                >
                                    <Text
                                        className={
                                            error
                                                ? "text-sm text-red-700"
                                                : "text-sm text-amber-800"
                                        }
                                    >
                                        {error || notice}
                                    </Text>
                                </View>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View className="mt-10 items-center justify-center">
                                <Ionicons name="people-outline" size={64} color="#9ca3af" />
                                <Text className="mt-4 text-center text-gray-500">
                                    {error
                                        ? "Data tamu tidak tersedia."
                                        : "Belum ada data tamu tercatat."}
                                </Text>
                            </View>
                        }
                    />
                )}

                <Pressable
                    onPress={() => {
                        void handleAddPress();
                    }}
                    className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg elevation-xl"
                >
                    <Ionicons name="add" size={32} color="#ffffff" />
                </Pressable>
            </View>
        </ProtectedRoute>
    );
}
