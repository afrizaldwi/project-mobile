import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from "react-native";

import { deleteKamar, getKamarPage } from "@/api/kamarService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
    DeleteModal,
    FilterStatus,
    KamarGridCard,
    KamarListCard,
    StatusDropdown,
} from "@/components/kamar";
import type { Kamar, KamarStats } from "@/types/kamar";
import type { PaginationMeta } from "@/types/pagination";

type ViewStrategy = "grid" | "list";
type FirstPageMode = "initial" | "refresh";

const PAGE_SIZE = 20;
const EMPTY_STATS: KamarStats = {
    total: 0,
    tersedia: 0,
    terisi: 0,
    perbaikan: 0,
};

function getErrorMessage(error: unknown, fallback = "Gagal memuat data kamar."): string {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        fallback
    );
}

export default function AdminKamarScreen() {
    const [items, setItems] = useState<Kamar[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [stats, setStats] = useState<KamarStats>(EMPTY_STATS);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
    const [viewStrategy, setViewStrategy] = useState<ViewStrategy>("grid");
    const [hapusModal, setHapusModal] = useState<{ visible: boolean; kamar: Kamar | null }>({
        visible: false,
        kamar: null,
    });
    const [hapusLoading, setHapusLoading] = useState(false);

    const requestGenerationRef = useRef(0);
    const requestControllerRef = useRef<AbortController | null>(null);
    const loadingMoreRef = useRef(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchInput]);

    const fetchFirstPage = useCallback(
        async (mode: FirstPageMode = "initial") => {
            const generation = requestGenerationRef.current + 1;
            requestGenerationRef.current = generation;
            requestControllerRef.current?.abort();

            const controller = new AbortController();
            requestControllerRef.current = controller;
            loadingMoreRef.current = false;
            setLoadingMore(false);
            setError(null);

            if (mode === "refresh") {
                setRefreshing(true);
            } else {
                setInitialLoading(true);
                setItems([]);
                setMeta(null);
            }

            try {
                const response = await getKamarPage(
                    {
                        page: 1,
                        per_page: PAGE_SIZE,
                        search: debouncedSearch || undefined,
                        status: filterStatus,
                    },
                    controller.signal
                );

                if (generation !== requestGenerationRef.current) return;

                setItems(response.data);
                setMeta(response.meta);
                setStats({
                    total: response.total,
                    tersedia: response.tersedia,
                    terisi: response.terisi,
                    perbaikan: response.perbaikan,
                });
            } catch (requestError) {
                if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
                const message = getErrorMessage(requestError);
                setError(message);
                Alert.alert("Error", message);
            } finally {
                if (generation === requestGenerationRef.current) {
                    setInitialLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [debouncedSearch, filterStatus]
    );

    useFocusEffect(
        useCallback(() => {
            void fetchFirstPage("initial");

            return () => {
                requestGenerationRef.current += 1;
                requestControllerRef.current?.abort();
                loadingMoreRef.current = false;
            };
        }, [fetchFirstPage])
    );

    const loadMore = useCallback(async () => {
        if (
            initialLoading ||
            refreshing ||
            loadingMoreRef.current ||
            !meta ||
            meta.current_page >= meta.last_page
        ) {
            return;
        }

        loadingMoreRef.current = true;
        setLoadingMore(true);
        setError(null);

        const generation = requestGenerationRef.current + 1;
        requestGenerationRef.current = generation;
        requestControllerRef.current?.abort();
        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            const response = await getKamarPage(
                {
                    page: meta.current_page + 1,
                    per_page: PAGE_SIZE,
                    search: debouncedSearch || undefined,
                    status: filterStatus,
                },
                controller.signal
            );

            if (generation !== requestGenerationRef.current) return;

            setItems((currentItems) => {
                const existingIds = new Set(currentItems.map((item) => item.id_kamar));
                const newItems = response.data.filter((item) => {
                    if (existingIds.has(item.id_kamar)) return false;
                    existingIds.add(item.id_kamar);
                    return true;
                });
                return [...currentItems, ...newItems];
            });
            setMeta(response.meta);
            setStats({
                total: response.total,
                tersedia: response.tersedia,
                terisi: response.terisi,
                perbaikan: response.perbaikan,
            });
        } catch (requestError) {
            if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
            setError(getErrorMessage(requestError));
        } finally {
            if (generation === requestGenerationRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [debouncedSearch, filterStatus, initialLoading, meta, refreshing]);

    const handleHapus = async () => {
        if (!hapusModal.kamar) return;

        try {
            setHapusLoading(true);
            await deleteKamar(hapusModal.kamar.id_kamar);
            setHapusModal({ visible: false, kamar: null });
            Alert.alert("Berhasil", "Kamar berhasil dihapus.");
            await fetchFirstPage("initial");
        } catch (deleteError) {
            setHapusModal({ visible: false, kamar: null });
            const message = getErrorMessage(deleteError, "Gagal menghapus kamar.");

            if (message.includes("No query results")) {
                Alert.alert("Data Tidak Ditemukan", "Kamar tidak ditemukan. Data akan di-refresh.", [
                    { text: "OK", onPress: () => void fetchFirstPage("initial") },
                ]);
            } else {
                Alert.alert("Gagal Menghapus", message);
            }
        } finally {
            setHapusLoading(false);
        }
    };

    const renderRoom = ({ item }: { item: Kamar }) => {
        const onEdit = () =>
            router.push({
                pathname: "/admin/kamar-edit",
                params: { id: item.id_kamar },
            });
        const onHapus = () => setHapusModal({ visible: true, kamar: item });

        return viewStrategy === "grid" ? (
            <KamarGridCard kamar={item} onEdit={onEdit} onHapus={onHapus} />
        ) : (
            <KamarListCard kamar={item} onEdit={onEdit} onHapus={onHapus} />
        );
    };

    const listHeader = (
        <>
            <View className="mb-3 flex-row items-start justify-between">
                <View className="flex-1">
                    <Text className="text-2xl font-extrabold text-dark">Data Kamar</Text>
                    <Text className="text-xs text-gray-500">Kelola data kamar Kost Bahagia</Text>
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
                ].map((stat) => (
                    <View key={stat.label} className="flex-1 rounded-xl bg-white p-3" style={{ elevation: 1 }}>
                        <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                            {stat.label}
                        </Text>
                        <Text className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</Text>
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
                        value={searchInput}
                        onChangeText={setSearchInput}
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

            {error && items.length > 0 ? (
                <Pressable
                    onPress={() => void fetchFirstPage("initial")}
                    className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 active:opacity-80"
                >
                    <Text className="text-center text-xs font-semibold text-red-700">{error}</Text>
                </Pressable>
            ) : null}
        </>
    );

    const listEmpty = initialLoading ? (
        <View className="items-center py-16">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-3 text-sm text-gray-400">Memuat data kamar...</Text>
        </View>
    ) : error ? (
        <View className="items-center py-16">
            <Text className="text-center text-sm font-semibold text-red-600">{error}</Text>
            <Pressable
                onPress={() => void fetchFirstPage("initial")}
                className="mt-3 rounded-xl bg-primary px-4 py-2.5 active:opacity-80"
            >
                <Text className="text-sm font-bold text-white">Muat Ulang</Text>
            </Pressable>
        </View>
    ) : (
        <View className="items-center py-16">
            <Text className="text-4xl">🛏️</Text>
            <Text className="mt-3 text-sm font-semibold text-gray-500">Belum ada data kamar</Text>
            <Text className="mt-1 text-center text-xs text-gray-400">
                {debouncedSearch
                    ? `Tidak ada kamar dengan nomor "${debouncedSearch}"`
                    : filterStatus !== "semua"
                      ? `Tidak ada kamar dengan status "${filterStatus}"`
                      : `Tap "+ Tambah" untuk menambah kamar baru`}
            </Text>
        </View>
    );

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <FlatList
                    key={viewStrategy}
                    data={items}
                    numColumns={viewStrategy === "grid" ? 2 : 1}
                    columnWrapperStyle={viewStrategy === "grid" ? { justifyContent: "space-between" } : undefined}
                    keyExtractor={(item) => String(item.id_kamar)}
                    renderItem={renderRoom}
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={listEmpty}
                    ListFooterComponent={
                        loadingMore ? (
                            <View className="items-center py-5">
                                <ActivityIndicator size="small" color="#2563eb" />
                            </View>
                        ) : null
                    }
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => void fetchFirstPage("refresh")}
                        />
                    }
                    onEndReached={() => void loadMore()}
                    onEndReachedThreshold={0.4}
                />

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
