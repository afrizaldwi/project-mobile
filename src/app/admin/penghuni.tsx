import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { type Penghuni, usePenghuni } from "@/hooks/usePenghuni";

import { PenghuniCard } from "@/components/penghuni/PenghuniCard";
import { PenghuniSearchFilter } from "@/components/penghuni/PenghuniSearchFilter";

export default function AdminPenghuniScreen() {
    const router = useRouter();
    const {
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        filteredData,
        isLoading,
        handleArchive,
        refetch,
    } = usePenghuni();

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const handlePerpanjang = (item: Penghuni) => {
        router.push({
            pathname: "/admin/perpanjang-sewa",
            params: {
                id_sewa: item.id,
                nama: item.nama,
                nomor_kamar: item.kamar,
                tanggal_masuk: item.tglMasuk,
                tanggal_keluar: item.tglKeluar,
                harga_bulanan: String(item.hargaBulanan || 0),
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-light">
                {/* Header Section */}
                <View className="px-6 pt-6 pb-4 bg-white shadow-sm flex-row justify-between items-center z-10">
                    <View>
                        <Text className="text-2xl font-bold text-dark">Data Penghuni</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push("/admin/tambah-penghuni")}
                        className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text className="text-white font-medium ml-1">Tambah Penghuni</Text>
                    </TouchableOpacity>
                </View>

                {/* Filters & Search Component */}
                <PenghuniSearchFilter
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                {/* List Section */}
                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-gray-500 mt-2 font-medium">Memuat data...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                        ListEmptyComponent={() => (
                            <View className="bg-white rounded-xl p-8 items-center border border-gray-100 shadow-sm">
                                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                                <Text className="text-gray-500 mt-2 text-center font-medium">
                                    Tidak ada data penghuni ditemukan
                                </Text>
                            </View>
                        )}
                        ListHeaderComponent={() => (
                            <View className="flex-row justify-between items-center mb-4 px-1">
                                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Daftar {activeTab === "AKTIF" ? "Penghuni Aktif" : "Alumni / Riwayat"}
                                </Text>
                                <Text className="text-xs font-semibold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
                                    {filteredData.length} Orang
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <PenghuniCard
                                item={item}
                                activeTab={activeTab}
                                onArchive={handleArchive}
                                onPerpanjang={handlePerpanjang}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </ProtectedRoute>
    );
}
