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

import { KeluhanCard } from "@/components/KeluhanCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePenyewaKeluhans } from "@/hooks/usePenyewaKeluhans";
import { getConnectivityStatus } from "@/network/connectivity";

export default function PenyewaKeluhanScreen() {
    const router = useRouter();
    const { keluhans, loading, refreshing, error, notice, refresh } =
        usePenyewaKeluhans();

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
                    <>
                        {error ? (
                            <View className="mx-4 mb-4 rounded-2xl border border-danger/20 bg-danger/10 p-4">
                                <Text className="text-sm font-semibold text-danger">
                                    {error}
                                </Text>
                            </View>
                        ) : null}
                        {notice ? (
                            <View className="mx-4 mb-4 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                                <Text className="text-sm font-semibold text-primary">
                                    {notice}
                                </Text>
                            </View>
                        ) : null}
                        <FlatList
                            data={keluhans}
                            keyExtractor={(item) => item.id_keluhan.toString()}
                            contentContainerClassName="px-4 pb-24 pt-2"
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: "space-between" }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                            }
                            renderItem={({ item }) => <KeluhanCard keluhan={item} />}
                            ListEmptyComponent={
                                !error ? (
                                    <View className="mt-10 items-center justify-center">
                                        <Ionicons
                                            name="document-text-outline"
                                            size={64}
                                            color="#9ca3af"
                                        />
                                        <Text className="mt-4 text-center text-gray-500">
                                            Belum ada keluhan yang dilaporkan.
                                        </Text>
                                    </View>
                                ) : null
                            }
                        />
                    </>
                )}

                <Pressable
                    onPress={async () => {
                        if ((await getConnectivityStatus()) === "offline") {
                            Alert.alert(
                                "Koneksi Diperlukan",
                                "Tindakan ini membutuhkan koneksi internet.",
                            );
                            return;
                        }
                        router.push("/penyewa/tambah-keluhan" as any);
                    }}
                    className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg elevation-xl"
                >
                    <Ionicons name="add" size={32} color="#ffffff" />
                </Pressable>
            </View>
        </ProtectedRoute>
    );
}
