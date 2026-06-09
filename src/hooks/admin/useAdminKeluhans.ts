import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

import { keluhanService } from "@/api/keluhanService";
import { Keluhan } from "@/types";
import type { AdminKeluhanStatus, AdminKeluhanSummary } from "@/types/keluhan";
import type { PaginationMeta } from "@/types/pagination";

export type KeluhanFilterStatus = AdminKeluhanStatus;

type FirstPageMode = "initial" | "refresh";

const PAGE_SIZE = 20;

function getErrorMessage(error: unknown, fallback: string): string {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        fallback
    );
}

export function useAdminKeluhans() {
    const [keluhans, setKeluhans] = useState<Keluhan[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [summary, setSummary] = useState<AdminKeluhanSummary | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<KeluhanFilterStatus>("semua");
    const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

    const requestGenerationRef = useRef(0);
    const requestControllerRef = useRef<AbortController | null>(null);
    const loadingMoreRef = useRef(false);
    const requestedPageRef = useRef<number | null>(null);
    const lastFailedRequestRef = useRef<FirstPageMode | "loadMore" | null>(null);

    const fetchFirstPage = useCallback(
        async (mode: FirstPageMode = "initial") => {
            const generation = requestGenerationRef.current + 1;
            requestGenerationRef.current = generation;
            requestControllerRef.current?.abort();

            const controller = new AbortController();
            requestControllerRef.current = controller;
            loadingMoreRef.current = false;
            requestedPageRef.current = null;
            setLoadingMore(false);
            setError(null);
            lastFailedRequestRef.current = null;

            if (mode === "refresh") {
                setRefreshing(true);
            } else {
                setInitialLoading(true);
                setKeluhans([]);
                setMeta(null);
                setSummary(null);
            }

            try {
                const response = await keluhanService.getAdminKeluhans({
                    page: 1,
                    per_page: PAGE_SIZE,
                    status: filter,
                    signal: controller.signal,
                });

                if (generation !== requestGenerationRef.current) return;

                setKeluhans(response.data);
                setMeta(response.meta);
                setSummary(response.summary);
            } catch (requestError) {
                if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
                console.error("Failed to fetch keluhan:", requestError);
                setError(getErrorMessage(requestError, "Gagal memuat data keluhan."));
                lastFailedRequestRef.current = mode;
            } finally {
                if (generation === requestGenerationRef.current) {
                    setInitialLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [filter]
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

    const onRefresh = useCallback(() => {
        void fetchFirstPage("refresh");
    }, [fetchFirstPage]);

    const loadMore = useCallback(async () => {
        if (
            initialLoading ||
            refreshing ||
            loadingMoreRef.current ||
            keluhans.length === 0 ||
            !meta ||
            meta.current_page >= meta.last_page
        ) {
            return;
        }

        const nextPage = meta.current_page + 1;
        if (requestedPageRef.current === nextPage) return;

        loadingMoreRef.current = true;
        requestedPageRef.current = nextPage;
        setLoadingMore(true);
        setError(null);
        lastFailedRequestRef.current = null;

        const generation = requestGenerationRef.current + 1;
        requestGenerationRef.current = generation;
        requestControllerRef.current?.abort();
        const controller = new AbortController();
        requestControllerRef.current = controller;

        try {
            const response = await keluhanService.getAdminKeluhans({
                page: nextPage,
                per_page: PAGE_SIZE,
                status: filter,
                signal: controller.signal,
            });

            if (generation !== requestGenerationRef.current) return;

            setKeluhans((currentKeluhans) => {
                const existingIds = new Set(currentKeluhans.map((item) => item.id_keluhan));
                const newKeluhans = response.data.filter((item) => {
                    if (existingIds.has(item.id_keluhan)) return false;
                    existingIds.add(item.id_keluhan);
                    return true;
                });
                return [...currentKeluhans, ...newKeluhans];
            });
            setMeta(response.meta);
        } catch (requestError) {
            if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
            console.error("Failed to load more keluhan:", requestError);
            requestedPageRef.current = null;
            setError(getErrorMessage(requestError, "Gagal memuat keluhan berikutnya."));
            lastFailedRequestRef.current = "loadMore";
        } finally {
            if (generation === requestGenerationRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [filter, initialLoading, keluhans.length, meta, refreshing]);

    const changeFilter = useCallback((status: KeluhanFilterStatus) => {
        if (filter === status) return;

        requestGenerationRef.current += 1;
        requestControllerRef.current?.abort();
        loadingMoreRef.current = false;
        requestedPageRef.current = null;
        lastFailedRequestRef.current = null;
        setLoadingMore(false);
        setRefreshing(false);
        setInitialLoading(true);
        setKeluhans([]);
        setMeta(null);
        setSummary(null);
        setError(null);
        setFilter(status);
    }, [filter]);

    const retry = useCallback(() => {
        if (lastFailedRequestRef.current === "loadMore") {
            void loadMore();
            return;
        }

        void fetchFirstPage(lastFailedRequestRef.current === "refresh" ? "refresh" : "initial");
    }, [fetchFirstPage, loadMore]);

    const handleDelete = async (id: number) => {
        try {
            await keluhanService.deleteAdminKeluhan(id);
            Alert.alert("Sukses", "Data keluhan berhasil dihapus.");
            await fetchFirstPage("initial");
        } catch (mutationError) {
            console.error("Failed to delete keluhan:", mutationError);
            Alert.alert("Error", getErrorMessage(mutationError, "Gagal menghapus keluhan."));
        }
    };

    const handleUpdateStatus = async (id: number, status: "pending" | "proses" | "selesai") => {
        try {
            await keluhanService.updateStatusKeluhan(id, { status_keluhan: status });
            Alert.alert("Sukses", "Status keluhan berhasil diperbarui.");
            await fetchFirstPage("initial");
        } catch (mutationError) {
            console.error("Failed to update status keluhan:", mutationError);
            Alert.alert("Error", getErrorMessage(mutationError, "Gagal memperbarui status."));
        }
    };

    const handleExport = async (format: "csv" | "json") => {
        try {
            setExporting(format);
            await keluhanService.exportAdminKeluhans({ format, status: filter });
        } catch (exportError) {
            console.error("Failed to export:", exportError);
            Alert.alert(
                "Error",
                getErrorMessage(
                    exportError,
                    "Gagal mengunduh laporan. Pastikan backend berjalan dan Anda sudah login."
                )
            );
        } finally {
            setExporting(null);
        }
    };

    return {
        keluhans,
        meta,
        summary,
        loading: initialLoading,
        initialLoading,
        refreshing,
        loadingMore,
        error,
        filter,
        setFilter: changeFilter,
        fetchKeluhans: fetchFirstPage,
        onRefresh,
        loadMore,
        retry,
        handleDelete,
        handleUpdateStatus,
        handleExport,
        exporting,
    };
}
