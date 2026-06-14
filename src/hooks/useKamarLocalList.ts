import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

import {
    deleteCachedKamar,
    getKamarLastSyncedAt,
    getKamarSyncMetadata,
    getLocalKamarPage,
    hasKamarCache,
    markKamarCacheDirty,
} from "@/database/kamarRepository";
import { synchronizeKamarCache } from "@/database/kamarSync";
import { getErrorMessage, getHttpStatus } from "@/utils/apiErrors";
import { getConnectivityStatus, type ConnectivityStatus } from "@/network/connectivity";
import type { FilterStatus } from "@/components/kamar";
import type { Kamar, KamarStats } from "@/types/kamar";
import type { PaginationMeta } from "@/types/pagination";

const PAGE_SIZE = 20;
const KAMAR_CACHE_FRESHNESS_MS = 5 * 60 * 1000;
const EMPTY_STATS: KamarStats = { total: 0, tersedia: 0, terisi: 0, perbaikan: 0 };
type Query = { search: string; status: FilterStatus };
type FirstPageMode = "initial" | "refresh";

function isFresh(lastSyncedAt: string | null): boolean {
    if (!lastSyncedAt) return false;
    const timestamp = Date.parse(lastSyncedAt);
    return Number.isFinite(timestamp) && Date.now() - timestamp < KAMAR_CACHE_FRESHNESS_MS;
}

export function useKamarLocalList(search: string, status: FilterStatus) {
    const db = useSQLiteContext();
    const [items, setItems] = useState<Kamar[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [stats, setStats] = useState<KamarStats>(EMPTY_STATS);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [connectivity, setConnectivity] = useState<ConnectivityStatus>("unknown");
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const mountedRef = useRef(false);
    const focusedRef = useRef(false);
    const generationRef = useRef(0);
    const loadingMoreRef = useRef(false);
    const filterEffectReadyRef = useRef(false);
    const queryRef = useRef<Query>({ search, status });
    queryRef.current = { search, status };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            generationRef.current += 1;
        };
    }, []);

    const loadFirstPage = useCallback(async (mode: FirstPageMode = "initial") => {
        const generation = generationRef.current + 1;
        generationRef.current = generation;
        loadingMoreRef.current = false;
        if (mountedRef.current) {
            setLoadingMore(false);
            setError(null);
            if (mode === "refresh") setRefreshing(true);
            else {
                setInitialLoading(true);
                setItems([]);
                setMeta(null);
            }
        }

        try {
            const query = queryRef.current;
            const [response, syncedAt] = await Promise.all([
                getLocalKamarPage(db, { page: 1, per_page: PAGE_SIZE, search: query.search || undefined, status: query.status }),
                getKamarLastSyncedAt(db),
            ]);
            if (!mountedRef.current || generation !== generationRef.current) return;
            setItems(response.data);
            setMeta(response.meta);
            setStats({ total: response.total, tersedia: response.tersedia, terisi: response.terisi, perbaikan: response.perbaikan });
            setLastSyncedAt(syncedAt);
        } catch (loadError) {
            if (mountedRef.current && generation === generationRef.current) setError(getErrorMessage(loadError, "Gagal membaca cache kamar lokal."));
        } finally {
            if (mountedRef.current && generation === generationRef.current) {
                setInitialLoading(false);
                setRefreshing(false);
            }
        }
    }, [db]);

    const syncAndReload = useCallback(async (force: boolean, showRefresh = false) => {
        if (mountedRef.current && showRefresh) setRefreshing(true);
        try {
            if (!force) {
                const [cacheExists, metadata] = await Promise.all([hasKamarCache(db), getKamarSyncMetadata(db)]);
                if (cacheExists && !metadata.isDirty && isFresh(metadata.lastSyncedAt)) return;
            }

            const networkStatus = await getConnectivityStatus();
            if (!mountedRef.current || !focusedRef.current) return;
            setConnectivity(networkStatus);
            if (networkStatus === "offline") {
                setNotice("Offline. Menampilkan data kamar yang tersimpan di perangkat.");
                return;
            }

            setSyncing(true);
            await synchronizeKamarCache(db);
            if (!mountedRef.current || !focusedRef.current) return;
            setConnectivity("online");
            setNotice(null);
            await loadFirstPage(showRefresh ? "refresh" : "initial");
        } catch (syncError) {
            if (!mountedRef.current || !focusedRef.current) return;
            const httpStatus = getHttpStatus(syncError);
            if (httpStatus === 401 || httpStatus === 403) setError(getErrorMessage(syncError, "Akses sinkronisasi kamar ditolak."));
            else setNotice(getErrorMessage(syncError, "Sinkronisasi server tidak tersedia. Menampilkan cache kamar lokal."));
        } finally {
            if (mountedRef.current) {
                setSyncing(false);
                if (showRefresh) setRefreshing(false);
            }
        }
    }, [db, loadFirstPage]);

    useFocusEffect(useCallback(() => {
        focusedRef.current = true;
        void loadFirstPage("initial");
        void syncAndReload(false);
        return () => {
            focusedRef.current = false;
            generationRef.current += 1;
            loadingMoreRef.current = false;
        };
    }, [loadFirstPage, syncAndReload]));

    useEffect(() => {
        if (!filterEffectReadyRef.current) {
            filterEffectReadyRef.current = true;
            return;
        }
        void loadFirstPage("initial");
    }, [search, status, loadFirstPage]);

    const loadMore = useCallback(async () => {
        if (initialLoading || refreshing || loadingMoreRef.current || !meta || meta.current_page >= meta.last_page) return;
        const generation = generationRef.current;
        const query = queryRef.current;
        loadingMoreRef.current = true;
        if (mountedRef.current) setLoadingMore(true);
        try {
            const response = await getLocalKamarPage(db, {
                page: meta.current_page + 1, per_page: PAGE_SIZE, search: query.search || undefined, status: query.status,
            });
            if (!mountedRef.current || generation !== generationRef.current) return;
            setItems((current) => {
                const ids = new Set(current.map((item) => item.id_kamar));
                return [...current, ...response.data.filter((item) => {
                    if (ids.has(item.id_kamar)) return false;
                    ids.add(item.id_kamar);
                    return true;
                })];
            });
            setMeta(response.meta);
        } catch (loadError) {
            if (mountedRef.current && generation === generationRef.current) setError(getErrorMessage(loadError, "Gagal memuat halaman cache kamar berikutnya."));
        } finally {
            if (mountedRef.current && generation === generationRef.current) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [db, initialLoading, meta, refreshing]);

    const removeDeletedAndRefresh = useCallback(async (id: number) => {
        await deleteCachedKamar(db, id);
        await markKamarCacheDirty(db);
        await syncAndReload(true);
    }, [db, syncAndReload]);

    return {
        items, meta, stats, initialLoading, refreshing, loadingMore, syncing, connectivity, lastSyncedAt, error, notice,
        reloadLocal: () => loadFirstPage("initial"),
        refresh: () => syncAndReload(true, true),
        loadMore,
        removeDeletedAndRefresh,
    };
}
