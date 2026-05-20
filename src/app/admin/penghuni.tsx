import { Text, View, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePenghuni } from "@/hooks/usePenghuni";

export default function AdminPenghuniScreen() {
    const router = useRouter();
    const { activeTab, setActiveTab, searchQuery, setSearchQuery, filteredData, isLoading, handleArchive } = usePenghuni();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-light">
                {/* Header Section */}
                <View className="px-6 pt-6 pb-4 bg-white shadow-sm flex-row justify-between items-center z-10">
                    <View>
                        <Text className="text-2xl font-bold text-dark">Data Penghuni</Text>
                        <Text className="text-sm text-gray-500 mt-1">Kelola data penghuni Kost Bahagia</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push("/admin/tambah-penghuni")}
                        className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text className="text-white font-medium ml-1">Tambah Penghuni</Text>
                    </TouchableOpacity>
                </View>

                {/* Filters Section */}
                <View className="px-6 py-4">
                    <View className="bg-white rounded-xl p-2 flex-row items-center justify-between border border-gray-100 shadow-sm">
                        {/* Tabs */}
                        <View className="flex-row bg-gray-50 rounded-lg p-1">
                            <TouchableOpacity
                                onPress={() => setActiveTab("AKTIF")}
                                className="px-4 py-2 rounded-md"
                                style={{
                                    backgroundColor: activeTab === "AKTIF" ? "#2563eb" : "transparent"
                                }}
                            >
                                <Text
                                    className="font-medium"
                                    style={{
                                        color: activeTab === "AKTIF" ? "white" : "#6b7280"
                                    }}
                                >
                                    Penghuni Aktif
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setActiveTab("NON AKTIF")}
                                className="px-4 py-2 rounded-md"
                                style={{
                                    backgroundColor: activeTab === "NON AKTIF" ? "#2563eb" : "transparent"
                                }}
                            >
                                <Text
                                    className="font-medium"
                                    style={{
                                        color: activeTab === "NON AKTIF" ? "white" : "#6b7280"
                                    }}
                                >
                                    Riwayat / Alumni
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg flex-1 ml-4">
                            <Ionicons name="search" size={20} color="#9ca3af" />
                            <TextInput
                                placeholder="Cari nama atau kamar..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="ml-2 flex-1 text-sm text-dark"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </View>
                </View>

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
                            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
                                {/* Top row: Kamar Info & Status */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-row items-center">
                                        <View className="bg-blue-50 px-3 py-1 rounded-lg mr-2">
                                            <Text className="font-bold text-blue-600 text-sm">{item.kamar}</Text>
                                        </View>
                                        <Text className="text-xs text-gray-400 font-medium">{item.ukuranKamar}</Text>
                                    </View>
                                    <View
                                        className="px-2.5 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: item.status === "AKTIF" ? "#dcfce7" : "#fee2e2"
                                        }}
                                    >
                                        <Text
                                            className="text-xs font-bold"
                                            style={{
                                                color: item.status === "AKTIF" ? "#16a34a" : "#dc2626"
                                            }}
                                        >
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                {/* Tenant Name & Email */}
                                <View className="mb-3">
                                    <Text className="font-bold text-dark text-lg">{item.nama}</Text>
                                    <Text className="text-sm text-gray-500 mt-0.5">{item.email}</Text>
                                </View>

                                {/* Divider */}
                                <View className="h-[1px] bg-gray-100 my-2" />

                                {/* Rental Period (Tgl Masuk & Tgl Keluar) */}
                                <View className="flex-row justify-between py-1.5">
                                    <View className="flex-1">
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal Masuk</Text>
                                        <Text className="text-sm font-semibold text-gray-700 mt-1">{item.tglMasuk}</Text>
                                    </View>
                                    <View className="flex-1 items-end">
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal Keluar</Text>
                                        <Text className="text-sm font-semibold text-gray-700 mt-1">{item.tglKeluar}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons for Active Tenants */}
                                {activeTab === "AKTIF" && (
                                    <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-gray-100">
                                        <TouchableOpacity className="mr-4 px-3 py-1.5 rounded-lg bg-gray-50">
                                            <Text className="text-xs font-semibold text-gray-500">Perpanjang</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => handleArchive(item.id)}
                                            className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                                        >
                                            <Text className="text-xs font-semibold text-red-600">Arsipkan</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    />
                )}
            </View>
        </ProtectedRoute>
    );
}