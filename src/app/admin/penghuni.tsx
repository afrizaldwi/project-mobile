import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { PenghuniCard } from "@/components/penghuni/PenghuniCard";
import { PenghuniSearchFilter } from "@/components/penghuni/PenghuniSearchFilter";
import {
    type Penghuni,
    type PenghuniFilterStatus,
    type PenghuniViewModel,
    usePenghuni,
} from "@/hooks/usePenghuni";
import { getConnectivityStatus } from "@/network/connectivity";

const FILTER_LABELS: Record<PenghuniFilterStatus, string> = {
    AKTIF: "Penghuni Aktif",
    SELESAI: "Sewa Selesai",
    SEMUA: "Semua Penghuni",
};

export default function AdminPenghuniScreen() {
    const router = useRouter();
    const {
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        filteredData,
        meta,
        isLoading,
        isArchiving,
        refreshing,
        loadingMore,
        error,
        notice,
        archiveConfirm,
        requestArchive,
        confirmArchive,
        cancelArchive,
        onRefresh,
        loadMore,
        retry,
        isOffline,
    } = usePenghuni();

    const handlePerpanjang = async (item: PenghuniViewModel) => {
        if ((await getConnectivityStatus()) === "offline") {
            return;
        }
        router.push({
            pathname: "/admin/perpanjang-sewa",
            params: {
                id_sewa: String(item.id_sewa),
                nama: item.nama,
                nomor_kamar: item.kamar,
                tanggal_masuk: item.tglMasuk,
                tanggal_keluar: item.tglKeluar,
                harga_bulanan: item.hargaBulanan,
            },
        });
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-light">
                {/* Header */}
                <View className="px-6 pt-6 pb-4 bg-white shadow-sm flex-row justify-between items-center z-10">
                    <View>
                        <Text className="text-2xl font-bold text-dark">Data Penghuni</Text>
                    </View>
                    {!isOffline && (
                        <TouchableOpacity
                            onPress={async () => {
                                if ((await getConnectivityStatus()) === "offline") return;
                                router.push("/admin/tambah-penghuni");
                            }}
                            className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text className="text-white font-medium ml-1">Tambah Penghuni</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isOffline && (
                    <View className="mx-6 mt-4 rounded-xl border border-warning/20 bg-warning/10 p-4 flex-row items-center gap-2">
                        <Ionicons name="cloud-offline" size={20} color="#f59e0b" />
                        <Text className="text-sm font-semibold text-warning flex-1">
                            Mode Offline – Hanya Bisa Lihat Data
                        </Text>
                    </View>
                )}

                {/* Filter & Search */}
                <PenghuniSearchFilter
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                {/* Daftar Penghuni */}
                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-gray-500 mt-2 font-medium">Memuat data...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => String(item.id_sewa)}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        onEndReached={() => {
                            if (filteredData.length > 0) void loadMore();
                        }}
                        onEndReachedThreshold={0.4}
                        ListEmptyComponent={() => (
                            <View className="bg-white rounded-xl p-8 items-center border border-gray-100 shadow-sm">
                                <Ionicons
                                    name={error ? "alert-circle-outline" : "people-outline"}
                                    size={48}
                                    color={error ? "#dc2626" : "#9ca3af"}
                                />
                                <Text
                                    className={`mt-2 text-center font-medium ${error ? "text-red-600" : "text-gray-500"}`}
                                >
                                    {error || "Tidak ada data penghuni ditemukan"}
                                </Text>
                                {error ? (
                                    <TouchableOpacity
                                        onPress={retry}
                                        className="mt-4 rounded-lg bg-primary px-4 py-2.5"
                                    >
                                        <Text className="font-bold text-white">Muat Ulang</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        )}
                        ListHeaderComponent={() => (
                            <>
                                {notice ? (
                                    <View className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                                        <Text className="text-center text-xs font-semibold text-yellow-700">
                                            {notice}
                                        </Text>
                                    </View>
                                ) : null}
                                {error && filteredData.length > 0 ? (
                                    <TouchableOpacity
                                        onPress={retry}
                                        className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3"
                                    >
                                        <Text className="text-center text-xs font-semibold text-red-700">
                                            {error}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                <View className="flex-row justify-between items-center mb-4 px-1">
                                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Daftar {FILTER_LABELS[activeTab]}
                                    </Text>
                                    <Text className="text-xs font-semibold text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
                                        {meta?.total ?? 0} Orang
                                    </Text>
                                </View>
                            </>
                        )}
                        ListFooterComponent={
                            loadingMore ? (
                                <ActivityIndicator size="small" color="#2563eb" className="py-5" />
                            ) : null
                        }
                        renderItem={({ item }) => (
                            <PenghuniCard
                                item={item}
                                onArchive={requestArchive}
                                onPerpanjang={handlePerpanjang}
                                isOffline={isOffline}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Modal Konfirmasi Arsip Penghuni (Poin 8) */}
            <ConfirmationModal
                visible={archiveConfirm.visible}
                title="Arsipkan Penghuni"
                description="Penghuni ini akan dipindahkan ke arsip alumni. Data sewa akan ditandai selesai."
                confirmLabel="Ya, Arsipkan"
                confirmVariant="danger"
                isLoading={isArchiving}
                dataPreview={
                    archiveConfirm.penghuniData
                        ? [
                            {
                                label: "Nama",
                                value: archiveConfirm.penghuniData.nama,
                            },
                            {
                                label: "Kamar",
                                value: archiveConfirm.penghuniData.kamar,
                            },
                            {
                                label: "Tgl Masuk",
                                value: archiveConfirm.penghuniData.tglMasuk,
                            },
                            {
                                label: "Tgl Keluar",
                                value: archiveConfirm.penghuniData.tglKeluar,
                            },
                        ]
                        : []
                }
                onConfirm={confirmArchive}
                onCancel={cancelArchive}
            />
        </ProtectedRoute>
    );
}
