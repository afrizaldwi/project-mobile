import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Penghuni } from "@/types/penghuni";
import { PenghuniCommand } from "@/api/penghuniService";

type TabState = "aktif" | "alumni";

function formatTanggal(tanggal: string): string {
    if (!tanggal) return "-";
    const [y, m, d] = tanggal.split("-");
    return `${d}/${m}/${y}`;
}

function PenghuniCard({
    item,
    tab,
    onPerpanjang,
}: {
    item: Penghuni;
    tab: TabState;
    onPerpanjang: (p: Penghuni) => void;
}) {
    return (
        <View className="mb-3 rounded-2xl border border-gray-200 bg-white p-4">
            <View className="mb-2 flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                    <Text className="text-sm font-extrabold text-dark">
                        {item.nama}
                    </Text>
                    <Text className="text-xs text-gray-400">{item.email}</Text>
                </View>
                {tab === "aktif" ? (
                    <View className="rounded-full bg-green-100 px-3 py-1">
                        <Text className="text-xs font-bold text-success">
                            ● AKTIF
                        </Text>
                    </View>
                ) : (
                    <View className="rounded-full bg-gray-100 px-3 py-1">
                        <Text className="text-xs font-bold text-gray-500">
                            ● ALUMNI
                        </Text>
                    </View>
                )}
            </View>

            <View className="mb-3 gap-1">
                <Text className="text-xs text-gray-500">
                    🚪 Kamar{" "}
                    <Text className="font-bold text-dark">{item.nomor_kamar}</Text>
                </Text>
                <Text className="text-xs text-gray-500">
                    📅 Masuk {formatTanggal(item.tanggal_masuk)}
                </Text>
                <Text className="text-xs text-gray-500">
                    📆 Keluar {formatTanggal(item.tanggal_keluar)}
                </Text>
            </View>

            {tab === "aktif" && (
                <View className="flex-row gap-2 border-t border-gray-100 pt-3">
                    <TouchableOpacity
                        onPress={() => onPerpanjang(item)}
                        className="flex-1 items-center justify-center rounded-lg bg-primary py-2"
                    >
                        <Text className="text-xs font-bold text-white">
                            ↻ Perpanjang
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        disabled
                        className="flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 py-2 opacity-40"
                    >
                        <Text className="text-xs font-bold text-danger">
                            🗂 Arsipkan
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

export default function AdminPenghuniScreen() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabState>("aktif");
    const [penghuni, setPenghuni] = useState<Penghuni[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await PenghuniCommand.fetchAktif();
            setPenghuni(data);
        } catch {
            Alert.alert("Error", "Gagal memuat data penghuni.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filtered = penghuni.filter(
        (p) =>
            p.nama.toLowerCase().includes(search.toLowerCase()) ||
            p.nomor_kamar.toLowerCase().includes(search.toLowerCase())
    );

    function handleSwitchTab(tab: TabState) {
        setActiveTab(tab);
        setSearch("");
    }

    function handlePerpanjang(p: Penghuni) {
        router.push({
            pathname: "/admin/perpanjang-sewa",
            params: {
                id_sewa: String(p.id_sewa),
                nama: p.nama,
                nomor_kamar: p.nomor_kamar,
                tanggal_masuk: p.tanggal_masuk,
                tanggal_keluar: p.tanggal_keluar,
                harga_bulanan: String(p.harga_bulanan),
            },
        });
    }

    async function onRefresh() {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary px-4 pt-5">
                <View className="mb-1 flex-row items-center justify-between">
                    <Text className="text-2xl font-extrabold text-dark">
                        Data Penghuni
                    </Text>
                    <TouchableOpacity
                        disabled
                        className="rounded-lg bg-primary px-4 py-2 opacity-40"
                    >
                        <Text className="text-xs font-bold text-white">
                            + Tambah
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text className="mb-4 text-sm text-gray-500">
                    Kelola data penghuni Kost Bahagia
                </Text>

                <View className="mb-3 flex-row border-b border-gray-200">
                    {(["aktif", "alumni"] as TabState[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => handleSwitchTab(tab)}
                            className={`mr-4 pb-2 ${
                                activeTab === tab
                                    ? "border-b-2 border-primary"
                                    : ""
                            }`}
                        >
                            <Text
                                className={`text-sm font-bold ${
                                    activeTab === tab
                                        ? "text-primary"
                                        : "text-gray-400"
                                }`}
                            >
                                {tab === "aktif"
                                    ? "Penghuni Aktif"
                                    : "Riwayat / Alumni"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mb-3 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
                    <Text className="text-gray-400">🔍</Text>
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Cari nama penghuni..."
                        className="flex-1 py-2 text-sm text-dark"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {loading ? (
                    <ActivityIndicator color="#2563eb" className="mt-10" />
                ) : activeTab === "alumni" ? (
                    <View className="mt-10 items-center">
                        <Text className="text-3xl">📋</Text>
                        <Text className="mt-2 text-sm text-gray-400">
                            Riwayat alumni tidak tersedia
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => String(item.id_sewa)}
                        renderItem={({ item }) => (
                            <PenghuniCard
                                item={item}
                                tab={activeTab}
                                onPerpanjang={handlePerpanjang}
                            />
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        ListEmptyComponent={
                            <View className="mt-10 items-center">
                                <Text className="text-3xl">👥</Text>
                                <Text className="mt-2 text-sm text-gray-400">
                                    Tidak ada penghuni ditemukan
                                </Text>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </ProtectedRoute>
    );
}