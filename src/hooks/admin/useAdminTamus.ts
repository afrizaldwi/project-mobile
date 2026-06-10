import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { tamuService } from "@/api/tamuService";
import type { AdminTamuItem, AdminTamuSummary } from "@/types/tamu";
import type { PaginationMeta } from "@/types/pagination";

type FirstPageMode = "initial" | "refresh";

const PAGE_SIZE = 20;

function getErrorMessage(error: unknown, fallback: string): string {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        fallback
    );
}

export function useAdminTamus() {
    const [tamus, setTamus] = useState<AdminTamuItem[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [summary, setSummary] = useState<AdminTamuSummary | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState({ value: "", revision: 0 });

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
                value: searchInput.trim(),
                revision: current.revision + 1,
            }));
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
            requestedPageRef.current = null;
            lastFailedRequestRef.current = null;
            setLoadingMore(false);
            setError(null);

            if (mode === "refresh") {
                setRefreshing(true);
            } else {
                setInitialLoading(true);
                setTamus([]);
                setMeta(null);
                setSummary(null);
            }

            try {
                const response = await tamuService.getAdminTamus({
                    page: 1,
                    per_page: PAGE_SIZE,
                    search: debouncedSearch.value || undefined,
                    signal: controller.signal,
                });

                if (generation !== requestGenerationRef.current) return;

                setTamus(response.data);
                setMeta(response.meta);
                setSummary(response.summary);
            } catch (requestError) {
                if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
                console.error("Failed to fetch tamu:", requestError);
                setError(getErrorMessage(requestError, "Gagal memuat data tamu."));
                lastFailedRequestRef.current = mode;
            } finally {
                if (generation === requestGenerationRef.current) {
                    setInitialLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [debouncedSearch]
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
            tamus.length === 0 ||
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
            const response = await tamuService.getAdminTamus({
                page: nextPage,
                per_page: PAGE_SIZE,
                search: debouncedSearch.value || undefined,
                signal: controller.signal,
            });

            if (generation !== requestGenerationRef.current) return;

            setTamus((currentItems) => {
                const existingIds = new Set(currentItems.map((item) => item.id_tamu));
                const newItems = response.data.filter((item) => {
                    if (existingIds.has(item.id_tamu)) return false;
                    existingIds.add(item.id_tamu);
                    return true;
                });
                return [...currentItems, ...newItems];
            });
            setMeta(response.meta);
        } catch (requestError) {
            if (controller.signal.aborted || generation !== requestGenerationRef.current) return;
            console.error("Failed to load more tamu:", requestError);
            requestedPageRef.current = null;
            setError(getErrorMessage(requestError, "Gagal memuat data tamu berikutnya."));
            lastFailedRequestRef.current = "loadMore";
        } finally {
            if (generation === requestGenerationRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [debouncedSearch, initialLoading, meta, refreshing, tamus.length]);

    const resetForSearchChange = useCallback(() => {
        requestGenerationRef.current += 1;
        requestControllerRef.current?.abort();
        loadingMoreRef.current = false;
        requestedPageRef.current = null;
        lastFailedRequestRef.current = null;
        setLoadingMore(false);
        setRefreshing(false);
        setInitialLoading(true);
        setTamus([]);
        setMeta(null);
        setSummary(null);
        setError(null);
    }, []);

    const changeSearch = useCallback((value: string) => {
        const nextValue = value.slice(0, 100);
        if (nextValue === searchInput) return;
        resetForSearchChange();
        setSearchInput(nextValue);
    }, [resetForSearchChange, searchInput]);

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

    const handleDelete = async (id: number) => {
        try {
            await tamuService.deleteAdminTamu(id);
            Alert.alert("Sukses", "Data tamu berhasil dihapus.");
            await fetchFirstPage("initial");
        } catch (mutationError) {
            console.error("Failed to delete tamu:", mutationError);
            Alert.alert("Error", getErrorMessage(mutationError, "Gagal menghapus data tamu."));
        }
    };

    return {
        tamus,
        meta,
        summary,
        loading: initialLoading,
        initialLoading,
        refreshing,
        loadingMore,
        error,
        searchInput,
        setSearchInput: changeSearch,
        fetchTamus: fetchFirstPage,
        onRefresh,
        loadMore,
        retry,
        handleDelete,
    };
}
