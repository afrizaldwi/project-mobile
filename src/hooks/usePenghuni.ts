import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { finishAdminPenghuni } from "@/api/penghuniService";
import { markKamarCacheDirty } from "@/database/kamarRepository";
import {
    getLocalPenghuniPage,
    getPenghuniSyncMetadata,
    hasPenghuniSnapshot,
    markPenghuniCacheDirty,
    type PenghuniLocalFilterStatus,
} from "@/database/penghuniRepository";
import { synchronizePenghuniCache } from "@/database/penghuniSync";
import {
    getConnectivityStatus,
    type ConnectivityStatus,
} from "@/network/connectivity";
import type { PaginationMeta } from "@/types/pagination";
import type {
    AdminPenghuniItem,
    AdminPenghuniItemStatus,
} from "@/types/penghuni";

export type StatusPenghuni = "AKTIF" | "SELESAI" | "DIBATALKAN";
export type PenghuniFilterStatus = "AKTIF" | "SELESAI" | "SEMUA";
export interface Penghuni {
    id_sewa: number;
    nama: string;
    email: string;
    kamar: string;
    ukuranKamar: string;
    tglMasuk: string;
    tglKeluar: string;
    status: StatusPenghuni;
    hargaBulanan: string;
}

const PAGE_SIZE = 20;
const CACHE_FRESHNESS_MS = 5 * 60 * 1000;
const LOCAL_STATUS: Record<PenghuniFilterStatus, PenghuniLocalFilterStatus> = {
    AKTIF: "aktif",
    SELESAI: "selesai",
    SEMUA: "all",
};
const STATUS_LABEL: Record<AdminPenghuniItemStatus, StatusPenghuni> = {
    aktif: "AKTIF",
    selesai: "SELESAI",
    dibatalkan: "DIBATALKAN",
};
function getErrorMessage(error: unknown, fallback: string): string {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ||
        (error instanceof Error ? error.message : null) ||
        fallback
    );
}
function getHttpStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } }).response?.status;
}
function isFresh(value: string | null): boolean {
    const timestamp = value ? Date.parse(value) : Number.NaN;
    return (
        Number.isFinite(timestamp) && Date.now() - timestamp < CACHE_FRESHNESS_MS
    );
}
function mapResponseToPenghuni(sewa: AdminPenghuniItem): Penghuni {
    return {
        id_sewa: sewa.id_sewa,
        nama: sewa.user?.nama_lengkap || "—",
        email: sewa.user?.email || "—",
        kamar: sewa.kamar?.nomor_kamar || "—",
        ukuranKamar: sewa.kamar?.luas_kamar || sewa.kamar?.fasilitas || "—",
        tglMasuk: sewa.tanggal_masuk,
        tglKeluar: sewa.tanggal_keluar || "—",
        status: STATUS_LABEL[sewa.status_sewa],
        hargaBulanan: sewa.kamar?.harga_bulanan || "0",
    };
}

export function usePenghuni() {
    const db = useSQLiteContext();
    const [activeTab, setActiveTabState] =
        useState<PenghuniFilterStatus>("AKTIF");
    const [searchQuery, setSearchQueryState] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [data, setData] = useState<Penghuni[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [connectivity, setConnectivity] =
        useState<ConnectivityStatus>("unknown");
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const mountedRef = useRef(false);
    const focusedRef = useRef(false);
    const generationRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const requestedPageRef = useRef<number | null>(null);
    const queryRef = useRef({ search: "", status: LOCAL_STATUS.AKTIF });
    queryRef.current = {
        search: debouncedSearch,
        status: LOCAL_STATUS[activeTab],
    };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            generationRef.current += 1;
        };
    }, []);
    useEffect(() => {
        const timeout = setTimeout(
            () => setDebouncedSearch(searchQuery.trim().slice(0, 100)),
            350,
        );
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const loadFirstPage = useCallback(
        async (soft = false) => {
            const generation = generationRef.current + 1;
            generationRef.current = generation;
            loadingMoreRef.current = false;
            requestedPageRef.current = null;
            if (mountedRef.current) {
                setLoadingMore(false);
                setError(null);
                if (!soft) {
                    setInitialLoading(true);
                    setData([]);
                    setMeta(null);
                }
            }
            try {
                const query = queryRef.current;
                const response = await getLocalPenghuniPage(db, {
                    page: 1,
                    per_page: PAGE_SIZE,
                    search: query.search || undefined,
                    status: query.status,
                });
                if (!mountedRef.current || generation !== generationRef.current) return;
                setData(response.data.map(mapResponseToPenghuni));
                setMeta(response.meta);
            } catch (loadError) {
                if (mountedRef.current && generation === generationRef.current)
                    setError(
                        getErrorMessage(loadError, "Gagal membaca cache PENGHUNI lokal."),
                    );
            } finally {
                if (mountedRef.current && generation === generationRef.current)
                    setInitialLoading(false);
            }
        },
        [db],
    );

    const syncAndReload = useCallback(
        async (force: boolean, showRefresh = false, cacheUsable = true) => {
            if (mountedRef.current && showRefresh) setRefreshing(true);
            try {
                if (!force) {
                    const metadata = await getPenghuniSyncMetadata(db);
                    if (
                        cacheUsable &&
                        !metadata.isDirty &&
                        isFresh(metadata.lastSyncedAt)
                    )
                        return;
                }
                const status = await getConnectivityStatus();
                if (!mountedRef.current || !focusedRef.current) return;
                setConnectivity(status);
                if (status === "offline") {
                    if (!cacheUsable)
                        setError(
                            "Offline dan belum ada data PENGHUNI tersimpan di perangkat.",
                        );
                    else
                        setNotice(
                            showRefresh
                                ? "Penyegaran membutuhkan koneksi internet. Cache lama tetap ditampilkan."
                                : "Offline. Menampilkan data PENGHUNI yang tersimpan di perangkat.",
                        );
                    return;
                }
                generationRef.current += 1;
                loadingMoreRef.current = false;
                requestedPageRef.current = null;
                setLoadingMore(false);
                setSyncing(true);
                await synchronizePenghuniCache(db);
                if (!mountedRef.current || !focusedRef.current) return;
                setConnectivity("online");
                setNotice(null);
                await loadFirstPage(true);
            } catch (syncError) {
                if (!mountedRef.current || !focusedRef.current) return;
                const status = getHttpStatus(syncError);
                const message = getErrorMessage(
                    syncError,
                    "Sinkronisasi PENGHUNI gagal. Cache lama tetap digunakan.",
                );
                if (!cacheUsable || status === 401 || status === 403) setError(message);
                else setNotice(message);
            } finally {
                if (mountedRef.current) {
                    setSyncing(false);
                    setRefreshing(false);
                    setInitialLoading(false);
                }
            }
        },
        [db, loadFirstPage],
    );

    useFocusEffect(
        useCallback(() => {
            focusedRef.current = true;
            void (async () => {
                const snapshot = await hasPenghuniSnapshot(db);
                if (snapshot) await loadFirstPage();
                await syncAndReload(false, false, snapshot);
            })().catch((focusError) => {
                if (mountedRef.current) {
                    setError(
                        getErrorMessage(focusError, "Gagal menyiapkan cache PENGHUNI."),
                    );
                    setInitialLoading(false);
                }
            });
            return () => {
                focusedRef.current = false;
                generationRef.current += 1;
                loadingMoreRef.current = false;
                requestedPageRef.current = null;
            };
        }, [db, loadFirstPage, syncAndReload]),
    );
    useEffect(() => {
        if (focusedRef.current) void loadFirstPage();
    }, [activeTab, debouncedSearch, loadFirstPage]);

    const loadMore = useCallback(async () => {
        if (
            initialLoading ||
            refreshing ||
            syncing ||
            loadingMoreRef.current ||
            data.length === 0 ||
            !meta ||
            meta.current_page >= meta.last_page
        )
            return;
        const nextPage = meta.current_page + 1;
        if (requestedPageRef.current === nextPage) return;
        const generation = generationRef.current;
        loadingMoreRef.current = true;
        requestedPageRef.current = nextPage;
        setLoadingMore(true);
        try {
            const query = queryRef.current;
            const response = await getLocalPenghuniPage(db, {
                page: nextPage,
                per_page: PAGE_SIZE,
                search: query.search || undefined,
                status: query.status,
            });
            if (!mountedRef.current || generation !== generationRef.current) return;
            setData((current) => {
                const ids = new Set(current.map((item) => item.id_sewa));
                return [
                    ...current,
                    ...response.data.map(mapResponseToPenghuni).filter((item) => {
                        if (ids.has(item.id_sewa)) return false;
                        ids.add(item.id_sewa);
                        return true;
                    }),
                ];
            });
            setMeta(response.meta);
        } catch (loadError) {
            requestedPageRef.current = null;
            if (mountedRef.current && generation === generationRef.current)
                setError(
                    getErrorMessage(
                        loadError,
                        "Gagal memuat halaman cache PENGHUNI berikutnya.",
                    ),
                );
        } finally {
            if (mountedRef.current && generation === generationRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [data.length, db, initialLoading, meta, refreshing, syncing]);

    const handleArchive = useCallback(
        async (idSewa: number) => {
            const status = await getConnectivityStatus();
            setConnectivity(status);
            if (status === "offline") {
                Alert.alert(
                    "Koneksi Diperlukan",
                    "Tindakan ini membutuhkan koneksi internet.",
                );
                return;
            }
            Alert.alert(
                "Konfirmasi",
                "Apakah Anda yakin ingin mengarsipkan penghuni ini sebagai alumni?",
                [
                    { text: "Batal", style: "cancel" },
                    {
                        text: "Arsipkan",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                const message = await finishAdminPenghuni(idSewa);
                                try {
                                    await Promise.all([
                                        markPenghuniCacheDirty(db),
                                        markKamarCacheDirty(db),
                                    ]);
                                    await synchronizePenghuniCache(db);
                                    await loadFirstPage(true);
                                    Alert.alert(
                                        "Sukses",
                                        message || "Penghuni berhasil diarsipkan.",
                                    );
                                } catch (cacheError) {
                                    console.error(
                                        "Failed to refresh PENGHUNI cache after finish:",
                                        cacheError,
                                    );
                                    Alert.alert(
                                        "Penghuni Diarsipkan",
                                        "Perubahan tersimpan di server, tetapi cache lokal belum berhasil diperbarui.",
                                    );
                                }
                            } catch (mutationError) {
                                Alert.alert(
                                    "Gagal",
                                    getErrorMessage(
                                        mutationError,
                                        "Gagal mengarsipkan penghuni.",
                                    ),
                                );
                            }
                        },
                    },
                ],
            );
        },
        [db, loadFirstPage],
    );

    return {
        activeTab,
        setActiveTab: setActiveTabState,
        searchQuery,
        setSearchQuery: (value: string) => setSearchQueryState(value.slice(0, 100)),
        filteredData: data,
        meta,
        isLoading: initialLoading,
        initialLoading,
        refreshing,
        loadingMore,
        syncing,
        connectivity,
        error,
        notice,
        refetch: loadFirstPage,
        onRefresh: () =>
            void syncAndReload(true, true, data.length > 0 || Boolean(meta)),
        loadMore,
        retry: () =>
            void syncAndReload(true, false, data.length > 0 || Boolean(meta)),
        handleArchive,
    };
}
