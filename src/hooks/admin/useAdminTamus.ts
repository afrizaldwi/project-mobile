import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { tamuService } from "@/api/tamuService";
import { getLocalTamuPage, getTamuSyncMetadata, hasTamuCache, markTamuCacheDirty } from "@/database/tamuRepository";
import { getJakartaToday, synchronizeTamuCache } from "@/database/tamuSync";
import { getConnectivityStatus, type ConnectivityStatus } from "@/network/connectivity";
import type { PaginationMeta } from "@/types/pagination";
import type { AdminTamuItem, AdminTamuSummary } from "@/types/tamu";

const PAGE_SIZE = 20;
const CACHE_FRESHNESS_MS = 5 * 60 * 1000;
const EMPTY_SUMMARY: AdminTamuSummary = { total_tamu: 0, total_penghuni_visited: 0, tamu_today: 0 };
type LoadMode = "initial" | "refresh" | "soft";

function getErrorMessage(error: unknown, fallback: string): string {
    return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) || fallback;
}
function getHttpStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } }).response?.status;
}
function isFresh(value: string | null): boolean {
    const timestamp = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(timestamp) && Date.now() - timestamp < CACHE_FRESHNESS_MS;
}

export function useAdminTamus() {
    const db = useSQLiteContext();
    const [tamus, setTamus] = useState<AdminTamuItem[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [summary, setSummary] = useState<AdminTamuSummary>(EMPTY_SUMMARY);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [connectivity, setConnectivity] = useState<ConnectivityStatus>("unknown");
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [searchInput, setSearchInputState] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const mountedRef = useRef(false);
    const focusedRef = useRef(false);
    const generationRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const requestedPageRef = useRef<number | null>(null);
    const searchRef = useRef("");
    searchRef.current = debouncedSearch;

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; generationRef.current += 1; };
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim().slice(0, 100)), 350);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const loadFirstPage = useCallback(async (mode: LoadMode = "initial") => {
        const generation = generationRef.current + 1;
        generationRef.current = generation;
        loadingMoreRef.current = false;
        requestedPageRef.current = null;
        if (mountedRef.current) {
            setLoadingMore(false);
            setError(null);
            if (mode === "refresh") setRefreshing(true);
            if (mode === "initial") { setInitialLoading(true); setTamus([]); setMeta(null); }
        }
        try {
            const [response, metadata] = await Promise.all([
                getLocalTamuPage(db, { page: 1, per_page: PAGE_SIZE, search: searchRef.current || undefined }, getJakartaToday()),
                getTamuSyncMetadata(db),
            ]);
            if (!mountedRef.current || generation !== generationRef.current) return;
            setTamus(response.data);
            setMeta(response.meta);
            setSummary(response.summary);
            setLastSyncedAt(metadata.lastSyncedAt);
        } catch (loadError) {
            if (mountedRef.current && generation === generationRef.current) setError(getErrorMessage(loadError, "Gagal membaca cache TAMU lokal."));
        } finally {
            if (mountedRef.current && generation === generationRef.current) { setInitialLoading(false); setRefreshing(false); }
        }
    }, [db]);

    const syncAndReload = useCallback(async (force: boolean, showRefresh = false, cacheUsable = true) => {
        if (mountedRef.current && showRefresh) setRefreshing(true);
        try {
            if (!force) {
                const metadata = await getTamuSyncMetadata(db);
                if (cacheUsable && !metadata.isDirty && isFresh(metadata.lastSyncedAt)) return;
            }
            const networkStatus = await getConnectivityStatus();
            if (!mountedRef.current || !focusedRef.current) return;
            setConnectivity(networkStatus);
            if (networkStatus === "offline") {
                if (!cacheUsable) setError("Offline dan belum ada data TAMU tersimpan di perangkat.");
                else setNotice("Offline. Menampilkan data TAMU yang tersimpan di perangkat.");
                return;
            }
            setSyncing(true);
            await synchronizeTamuCache(db);
            if (!mountedRef.current || !focusedRef.current) return;
            setConnectivity("online");
            setNotice(null);
            await loadFirstPage(cacheUsable ? "soft" : "initial");
        } catch (syncError) {
            if (!mountedRef.current || !focusedRef.current) return;
            const status = getHttpStatus(syncError);
            const message = getErrorMessage(syncError, "Sinkronisasi TAMU gagal. Cache lama tetap digunakan.");
            if (!cacheUsable || status === 401 || status === 403) setError(message);
            else if (!status || status >= 500) setNotice(message);
            else setError(message);
        } finally {
            if (mountedRef.current) { setSyncing(false); setRefreshing(false); setInitialLoading(false); }
        }
    }, [db, loadFirstPage]);

    useFocusEffect(useCallback(() => {
        focusedRef.current = true;
        void (async () => {
            const [hasRows, metadata] = await Promise.all([hasTamuCache(db), getTamuSyncMetadata(db)]);
            const cacheUsable = hasRows || Boolean(metadata.lastSyncedAt);
            if (cacheUsable) await loadFirstPage("initial");
            await syncAndReload(false, false, cacheUsable);
        })().catch((focusError) => {
            if (mountedRef.current) { setError(getErrorMessage(focusError, "Gagal menyiapkan cache TAMU.")); setInitialLoading(false); }
        });
        return () => { focusedRef.current = false; generationRef.current += 1; loadingMoreRef.current = false; requestedPageRef.current = null; };
    }, [db, loadFirstPage, syncAndReload]));

    useEffect(() => {
        if (!focusedRef.current) return;
        void loadFirstPage("initial");
    }, [debouncedSearch, loadFirstPage]);

    const loadMore = useCallback(async () => {
        if (initialLoading || refreshing || loadingMoreRef.current || tamus.length === 0 || !meta || meta.current_page >= meta.last_page) return;
        const nextPage = meta.current_page + 1;
        if (requestedPageRef.current === nextPage) return;
        const generation = generationRef.current;
        loadingMoreRef.current = true;
        requestedPageRef.current = nextPage;
        setLoadingMore(true);
        try {
            const response = await getLocalTamuPage(db, { page: nextPage, per_page: PAGE_SIZE, search: searchRef.current || undefined }, getJakartaToday());
            if (!mountedRef.current || generation !== generationRef.current) return;
            setTamus((current) => {
                const ids = new Set(current.map((item) => item.id_tamu));
                return [...current, ...response.data.filter((item) => { if (ids.has(item.id_tamu)) return false; ids.add(item.id_tamu); return true; })];
            });
            setMeta(response.meta);
        } catch (loadError) {
            requestedPageRef.current = null;
            if (mountedRef.current && generation === generationRef.current) setError(getErrorMessage(loadError, "Gagal memuat halaman cache TAMU berikutnya."));
        } finally {
            if (mountedRef.current && generation === generationRef.current) { loadingMoreRef.current = false; setLoadingMore(false); }
        }
    }, [db, initialLoading, meta, refreshing, tamus.length]);

    const handleDelete = useCallback(async (id: number) => {
        const networkStatus = await getConnectivityStatus();
        setConnectivity(networkStatus);
        if (networkStatus === "offline") { Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet."); return; }
        try {
            await tamuService.deleteAdminTamu(id);
            try {
                await markTamuCacheDirty(db);
                await syncAndReload(true, false, true);
                Alert.alert("Sukses", "Data tamu berhasil dihapus.");
            } catch (cacheError) {
                console.error("Failed to refresh TAMU cache after delete:", cacheError);
                Alert.alert("Tamu Terhapus", "Data tamu terhapus di server, tetapi cache lokal belum berhasil diperbarui.");
            }
        } catch (mutationError) {
            Alert.alert("Error", getErrorMessage(mutationError, "Gagal menghapus data tamu. Tindakan ini membutuhkan koneksi internet."));
        }
    }, [db, syncAndReload]);

    return {
        tamus, meta, summary, loading: initialLoading, initialLoading, refreshing, loadingMore, syncing,
        connectivity, lastSyncedAt, error, notice, searchInput,
        setSearchInput: (value: string) => setSearchInputState(value.slice(0, 100)),
        fetchTamus: loadFirstPage, onRefresh: () => void syncAndReload(true, true, tamus.length > 0 || Boolean(lastSyncedAt)),
        loadMore, retry: () => void syncAndReload(true, false, tamus.length > 0 || Boolean(lastSyncedAt)), handleDelete,
    };
}
