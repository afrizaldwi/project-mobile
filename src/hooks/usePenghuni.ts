import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { finishAdminPenghuni, getAdminPenghuniPage } from "@/api/penghuniService";
import type { PaginationMeta } from "@/types/pagination";
import type { AdminPenghuniApiStatus, AdminPenghuniItem, StatusSewa } from "@/types/penghuni";

export type StatusPenghuni = "AKTIF" | "SELESAI";
export type PenghuniFilterStatus = StatusPenghuni | "SEMUA";

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

type FirstPageMode = "initial" | "refresh";

const PAGE_SIZE = 20;

const API_STATUS_BY_FILTER: Record<PenghuniFilterStatus, AdminPenghuniApiStatus> = {
    AKTIF: "aktif",
    SELESAI: "selesai",
    SEMUA: "all",
};

const STATUS_LABEL: Record<StatusSewa, StatusPenghuni> = {
    aktif: "AKTIF",
    selesai: "SELESAI",
};

function getErrorMessage(error: unknown, fallback: string): string {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        fallback
    );
}

const mapResponseToPenghuni = (sewa: AdminPenghuniItem): Penghuni => {
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
};

export function usePenghuni() {
    const [activeTab, setActiveTabState] = useState<PenghuniFilterStatus>("AKTIF");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState({ value: "", revision: 0 });
    const [data, setData] = useState<Penghuni[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const requestGenerationRef = useRef(0);
    const requestControllerRef = useRef<AbortController | null>(null);
    const loadingMoreRef = useRef(false);
    const requestedPageRef = useRef<number | null>(null);
    const lastFailedRequestRef = useRef<FirstPageMode | "loadMore" | null>(null);
    const initialSearchEffectRef = useRef(true);

    useEffect(() => {
        if (initialSearchEffectRef.current) {
            initialSearchEffectRef.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            setDebouncedSearch((current) => ({
                value: searchQuery.trim(),
                revision: current.revision + 1,
            }));
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const fetchFirstPage = useCallback(
        async (mode: FirstPageMode = "initial") => {
            const generation = requestGenerationRef.current + 1;
            requestGenerationRef.current = generation;
            requestControllerRef.current?.abort();

            const controller = new AbortController();
            requestControllerRef.current = controller;
            loadingMoreRef.current = false;
            requestedPageRef.current = null;
            lastFailedRequestRef.current = null;
            setLoadingMore(false);
            setError(null);

            if (mode === "refresh") {
                setRefreshing(true);
            } else {
                setInitialLoading(true);
                setData([]);
                setMeta(null);
            }

            try {
                const response = await getAdminPenghuniPage({
                    page: 1,
                    per_page: PAGE_SIZE,
                    search: debouncedSearch.value || undefined,
                    status: API_STATUS_BY_FILTER[activeTab],
                    signal: controller.signal,
                });

                if (generation !== requestGenerationRef.current) return;

                setData(response.data.map(mapResponseToPenghuni));
                setMeta(response.meta);
            } catch (requestError) {
                if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
                setError(getErrorMessage(requestError, "Gagal memuat data penghuni."));
                lastFailedRequestRef.current = mode;
            } finally {
                if (generation === requestGenerationRef.current) {
                    setInitialLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [activeTab, debouncedSearch]
    );

    useFocusEffect(
        useCallback(() => {
            void fetchFirstPage("initial");

            return () => {
                requestGenerationRef.current += 1;
                requestControllerRef.current?.abort();
                loadingMoreRef.current = false;
                requestedPageRef.current = null;
                lastFailedRequestRef.current = null;
            };
        }, [fetchFirstPage])
    );

    const loadMore = useCallback(async () => {
        if (
            initialLoading ||
            refreshing ||
            loadingMoreRef.current ||
            data.length === 0 ||
            !meta ||
            meta.current_page >= meta.last_page
        ) {
            return;
        }

        const nextPage = meta.current_page + 1;
        if (requestedPageRef.current === nextPage) return;

        loadingMoreRef.current = true;
        requestedPageRef.current = nextPage;
        lastFailedRequestRef.current = null;
        setLoadingMore(true);
        setError(null);

        const generation = requestGenerationRef.current + 1;
        requestGenerationRef.current = generation;
        requestControllerRef.current?.abort();
        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            const response = await getAdminPenghuniPage({
                page: nextPage,
                per_page: PAGE_SIZE,
                search: debouncedSearch.value || undefined,
                status: API_STATUS_BY_FILTER[activeTab],
                signal: controller.signal,
            });

            if (generation !== requestGenerationRef.current) return;

            const mappedItems = response.data.map(mapResponseToPenghuni);
            setData((currentItems) => {
                const existingIds = new Set(currentItems.map((item) => item.id_sewa));
                const newItems = mappedItems.filter((item) => {
                    if (existingIds.has(item.id_sewa)) return false;
                    existingIds.add(item.id_sewa);
                    return true;
                });
                return [...currentItems, ...newItems];
            });
            setMeta(response.meta);
        } catch (requestError) {
            if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
            requestedPageRef.current = null;
            setError(getErrorMessage(requestError, "Gagal memuat penghuni berikutnya."));
            lastFailedRequestRef.current = "loadMore";
        } finally {
            if (generation === requestGenerationRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [activeTab, data.length, debouncedSearch, initialLoading, meta, refreshing]);

    const resetForQueryChange = useCallback(() => {
        requestGenerationRef.current += 1;
        requestControllerRef.current?.abort();
        loadingMoreRef.current = false;
        requestedPageRef.current = null;
        lastFailedRequestRef.current = null;
        setLoadingMore(false);
        setRefreshing(false);
        setInitialLoading(true);
        setData([]);
        setMeta(null);
        setError(null);
    }, []);

    const setActiveTab = useCallback((status: PenghuniFilterStatus) => {
        if (status === activeTab) return;
        resetForQueryChange();
        setActiveTabState(status);
    }, [activeTab, resetForQueryChange]);

    const changeSearchQuery = useCallback((query: string) => {
        const nextQuery = query.slice(0, 100);
        if (nextQuery === searchQuery) return;
        resetForQueryChange();
        setSearchQuery(nextQuery);
    }, [resetForQueryChange, searchQuery]);

    const onRefresh = useCallback(() => {
        void fetchFirstPage("refresh");
    }, [fetchFirstPage]);

    const retry = useCallback(() => {
        if (lastFailedRequestRef.current === "loadMore") {
            void loadMore();
            return;
        }

        void fetchFirstPage(lastFailedRequestRef.current === "refresh" ? "refresh" : "initial");
    }, [fetchFirstPage, loadMore]);

    const handleArchive = (idSewa: number) => {
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
                            Alert.alert("Sukses", message || "Penghuni berhasil diarsipkan.");
                            await fetchFirstPage("initial");
                        } catch (mutationError) {
                            Alert.alert("Gagal", getErrorMessage(mutationError, "Gagal mengarsipkan penghuni."));
                        }
                    }
                }
            ]
        );
    };

    return {
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery: changeSearchQuery,
        filteredData: data,
        meta,
        isLoading: initialLoading,
        initialLoading,
        refreshing,
        loadingMore,
        error,
        refetch: fetchFirstPage,
        onRefresh,
        loadMore,
        retry,
        handleArchive,
    };
}
