import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
    DeleteModal,
    FilterStatus,
    KamarGridCard,
    KamarListCard,
    StatusDropdown,
} from "@/components/kamar";
import { deleteKamar, getAllKamar } from "@/api/kamarService";
import type { Kamar, KamarListResponse } from "@/types/kamar";

type ViewStrategy = "grid" | "list";

export default function AdminKamarScreen() {
    const [kamarData, setKamarData] = useState<KamarListResponse | null>(null);
    const [kamarList, setKamarList] = useState<Kamar[]>([]);
    const [filtered, setFiltered] = useState<Kamar[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
    const [viewStrategy, setViewStrategy] = useState<ViewStrategy>("grid");
    const [hapusModal, setHapusModal] = useState<{ visible: boolean; kamar: Kamar | null }>({
        visible: false,
        kamar: null,
    });
    const [hapusLoading, setHapusLoading] = useState(false);

    const stats = {
        total: kamarData?.total ?? 0,
        tersedia: kamarData?.tersedia ?? 0,
        terisi: kamarData?.terisi ?? 0,
        perbaikan: kamarData?.perbaikan ?? 0,
    };

    const fetchKamar = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllKamar();
            setKamarData(data);
            setKamarList(data.data);
            setFiltered(data.data);
        } catch {
            Alert.alert("Error", "Gagal memuat data kamar.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchKamar();
        }, [fetchKamar])
    );

    useEffect(() => {
        let result = kamarList;
        if (filterStatus !== "semua") {
            result = result.filter((k) => k.status_kamar === filterStatus);
        }
        if (search.trim()) {
            result = result.filter((k) =>
                k.nomor_kamar.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFiltered(result);
    }, [search, filterStatus, kamarList]);

    const handleHapus = async () => {
        if (!hapusModal.kamar) return;
        try {
            setHapusLoading(true);
            await deleteKamar(hapusModal.kamar.id_kamar);
            setHapusModal({ visible: false, kamar: null });
            Alert.alert("Berhasil", "Kamar berhasil dihapus.");
            await fetchKamar();
        } catch (e: any) {
            setHapusModal({ visible: false, kamar: null });
            const msg = e?.response?.data?.message ?? "Gagal menghapus kamar.";

            if (msg.includes("No query results")) {
                Alert.alert(
                    "Data Tidak Ditemukan",
"Kamar tidak ditemukan. Data akan di-refresh.",
                    [{ text: "OK", onPress: () => fetchKamar() }]
                );
            } else {
                Alert.alert("Gagal Menghapus", msg);
            }
        } finally {
            setHapusLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchKamar();
        setRefreshing(false);
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View className="mb-3 flex-row items-start justify-between">
                        <View className="flex-1">
                            <Text className="text-2xl font-extrabold text-dark">Data Kamar</Text>
                            <Text className="text-xs text-gray-500">
                                Kelola data kamar Kost Bahagia
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => router.push("/admin/kamar-tambah")}
                            className="rounded-xl bg-primary px-4 py-2.5 active:opacity-80"
                        >
                            <Text className="text-sm font-bold text-white">+ Tambah</Text>
                        </Pressable>
                    </View>

                    <View className="mb-3 flex-row gap-2">
                        {[
                            { label: "Total", value: stats.total, color: "text-dark" },
                            { label: "Tersedia", value: stats.tersedia, color: "text-green-600" },
                            { label: "Terisi", value: stats.terisi, color: "text-red-600" },
                            { label: "Perbaikan", value: stats.perbaikan, color: "text-amber-600" },
                        ].map((s) => (
                            <View
                                key={s.label}
                                className="flex-1 rounded-xl bg-white p-3"
                                style={{ elevation: 1 }}
                            >
                                <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                    {s.label}
                                </Text>
                                <Text className={`text-2xl font-extrabold ${s.color}`}>
                                    {s.value}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View className="mb-4 flex-row items-center gap-2">
                        <View
                            className="flex-1 flex-row items-center rounded-xl bg-white px-3"
                            style={{ elevation: 1, height: 44 }}
                        >
                            <Text className="mr-2 text-gray-400">🔍</Text>
                            <TextInput
                                placeholder="Cari nomor kamar..."
                                placeholderTextColor="#9ca3af"
                                value={search}
                                onChangeText={setSearch}
                                className="flex-1 text-sm text-dark"
                                style={{ height: 44 }}
                            />
                        </View>

                        <StatusDropdown selected={filterStatus} onSelect={setFilterStatus} />

                        <View
                            className="flex-row rounded-xl bg-white p-1"
                            style={{ elevation: 1, height: 44, alignItems: "center" }}
                        >
                            <Pressable
                                onPress={() => setViewStrategy("grid")}
                                className={`rounded-lg px-2.5 py-1.5 ${viewStrategy === "grid" ? "bg-primary" : ""}`}
                            >
                                <Text className={`text-sm ${viewStrategy === "grid" ? "text-white" : "text-gray-400"}`}>
                                    ⊞
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setViewStrategy("list")}
                                className={`rounded-lg px-2.5 py-1.5 ${viewStrategy === "list" ? "bg-primary" : ""}`}
                            >
                                <Text className={`text-sm ${viewStrategy === "list" ? "text-white" : "text-gray-400"}`}>
                                    ☰
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {loading && (
                        <View className="items-center py-16">
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text className="mt-3 text-sm text-gray-400">Memuat data kamar...</Text>
                        </View>
                    )}

                    {!loading && filtered.length === 0 && (
                        <View className="items-center py-16">
                            <Text className="text-4xl">🛏️</Text>
                            <Text className="mt-3 text-sm font-semibold text-gray-500">
                                Belum ada data kamar
                            </Text>
                            <Text className="mt-1 text-xs text-gray-400">
                                {filterStatus !== "semua"
                                    ? `Tidak ada kamar dengan status "${filterStatus}"`
                                    : `Tap "+ Tambah" untuk menambah kamar baru`}
                            </Text>
                        </View>
                    )}

                    {!loading && filtered.length > 0 && viewStrategy === "grid" && (
                        <View className="flex-row flex-wrap justify-between gap-y-0">
                            {filtered.map((kamar) => (
                                <KamarGridCard
                                    key={kamar.id_kamar}
                                    kamar={kamar}
                                    onEdit={() =>
                                        router.push({
                                            pathname: "/admin/kamar-edit",
                                            params: { id: kamar.id_kamar },
                                        })
                                    }
                                    onHapus={() => setHapusModal({ visible: true, kamar })}
                                />
                            ))}
                        </View>
                    )}

                    {!loading && filtered.length > 0 && viewStrategy === "list" && (
                        <View>
                            {filtered.map((kamar) => (
                                <KamarListCard
                                    key={kamar.id_kamar}
                                    kamar={kamar}
                                    onEdit={() =>
                                        router.push({
                                            pathname: "/admin/kamar-edit",
                                            params: { id: kamar.id_kamar },
                                        })
                                    }
                                    onHapus={() => setHapusModal({ visible: true, kamar })}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>

                <DeleteModal
                    visible={hapusModal.visible}
                    kamar={hapusModal.kamar}
                    loading={hapusLoading}
                    onClose={() => setHapusModal({ visible: false, kamar: null })}
                    onConfirm={handleHapus}
                />
            </View>
        </ProtectedRoute>
    );
}