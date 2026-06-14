import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { keluhanService } from "@/api/keluhanService";
import { getKeluhanSyncMetadata, getLocalKeluhanPage, hasKeluhanSnapshot, markKeluhanCacheDirty } from "@/database/keluhanRepository";
import { synchronizeKeluhanCache } from "@/database/keluhanSync";
import { getConnectivityStatus, type ConnectivityStatus } from "@/network/connectivity";
import type { Keluhan } from "@/types";
import type { AdminKeluhanStatus, AdminKeluhanSummary } from "@/types/keluhan";
import type { PaginationMeta } from "@/types/pagination";
import { getErrorMessage, getHttpStatus, isFresh } from "@/utils/helpers";

export type KeluhanFilterStatus = AdminKeluhanStatus;
const PAGE_SIZE = 20;
const CACHE_FRESHNESS_MS = 5 * 60 * 1000;


export function useAdminKeluhans() {
    const db = useSQLiteContext();
    const [keluhans, setKeluhans] = useState<Keluhan[]>([]); const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [summary, setSummary] = useState<AdminKeluhanSummary | null>(null); const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); const [loadingMore, setLoadingMore] = useState(false); const [syncing, setSyncing] = useState(false);
    const [connectivity, setConnectivity] = useState<ConnectivityStatus>("unknown"); const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
    const [filter, setFilter] = useState<KeluhanFilterStatus>("semua"); const [exporting, setExporting] = useState<"csv" | "json" | null>(null);
    const mountedRef = useRef(false); const focusedRef = useRef(false); const generationRef = useRef(0); const loadingMoreRef = useRef(false); const requestedPageRef = useRef<number | null>(null); const filterRef = useRef<KeluhanFilterStatus>(filter); filterRef.current = filter;

    useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; generationRef.current += 1; }; }, []);
    const loadFirstPage = useCallback(async (soft = false) => {
        const generation = generationRef.current + 1; generationRef.current = generation; loadingMoreRef.current = false; requestedPageRef.current = null;
        if (mountedRef.current) { setLoadingMore(false); setError(null); if (!soft) { setInitialLoading(true); setKeluhans([]); setMeta(null); setSummary(null); } }
        try {
            const response = await getLocalKeluhanPage(db, { page: 1, per_page: PAGE_SIZE, status: filterRef.current });
            if (!mountedRef.current || generation !== generationRef.current) return;
            setKeluhans(response.data); setMeta(response.meta); setSummary(response.summary);
        } catch (loadError) { if (mountedRef.current && generation === generationRef.current) setError(getErrorMessage(loadError, "Gagal membaca cache KELUHAN lokal.")); }
        finally { if (mountedRef.current && generation === generationRef.current) setInitialLoading(false); }
    }, [db]);
    const syncAndReload = useCallback(async (force: boolean, showRefresh = false, cacheUsable = true) => {
        if (mountedRef.current && showRefresh) setRefreshing(true);
        try {
            if (!force) { const metadata = await getKeluhanSyncMetadata(db); if (cacheUsable && !metadata.isDirty && isFresh(metadata.lastSyncedAt, CACHE_FRESHNESS_MS)) return; }
            const status = await getConnectivityStatus(); if (!mountedRef.current || !focusedRef.current) return; setConnectivity(status);
            if (status === "offline") { if (!cacheUsable) setError("Offline dan belum ada data KELUHAN tersimpan di perangkat."); else setNotice(showRefresh ? "Penyegaran membutuhkan koneksi internet. Cache lama tetap ditampilkan." : "Offline. Menampilkan data KELUHAN yang tersimpan di perangkat."); return; }
            generationRef.current += 1; loadingMoreRef.current = false; requestedPageRef.current = null; setLoadingMore(false); setSyncing(true);
            await synchronizeKeluhanCache(db, force); if (!mountedRef.current || !focusedRef.current) return; setConnectivity("online"); setNotice(null); await loadFirstPage(true);
        } catch (syncError) {
            if (!mountedRef.current || !focusedRef.current) return; const status = getHttpStatus(syncError); const message = getErrorMessage(syncError, cacheUsable ? "Sinkronisasi KELUHAN gagal. Cache lama tetap digunakan." : "Data KELUHAN belum tersedia dan sinkronisasi tidak dapat diselesaikan.");
            if (!cacheUsable || status === 401 || status === 403) setError(message); else setNotice(message);
        } finally { if (mountedRef.current) { setSyncing(false); setRefreshing(false); setInitialLoading(false); } }
    }, [db, loadFirstPage]);
    useFocusEffect(useCallback(() => {
        focusedRef.current = true; void (async () => { const snapshot = await hasKeluhanSnapshot(db); if (snapshot) await loadFirstPage(); await syncAndReload(false, false, snapshot); })().catch((focusError) => { if (mountedRef.current) { setError(getErrorMessage(focusError, "Gagal menyiapkan cache KELUHAN.")); setInitialLoading(false); } });
        return () => { focusedRef.current = false; generationRef.current += 1; loadingMoreRef.current = false; requestedPageRef.current = null; };
    }, [db, loadFirstPage, syncAndReload]));
    const loadMore = useCallback(async () => {
        if (initialLoading || refreshing || syncing || loadingMoreRef.current || keluhans.length === 0 || !meta || meta.current_page >= meta.last_page) return;
        const nextPage = meta.current_page + 1; if (requestedPageRef.current === nextPage) return; const generation = generationRef.current; loadingMoreRef.current = true; requestedPageRef.current = nextPage; setLoadingMore(true);
        try { const response = await getLocalKeluhanPage(db, { page: nextPage, per_page: PAGE_SIZE, status: filterRef.current }); if (!mountedRef.current || generation !== generationRef.current) return; setKeluhans((current) => { const ids = new Set(current.map((item) => item.id_keluhan)); return [...current, ...response.data.filter((item) => { if (ids.has(item.id_keluhan)) return false; ids.add(item.id_keluhan); return true; })]; }); setMeta(response.meta); setSummary(response.summary); }
        catch (loadError) { requestedPageRef.current = null; if (mountedRef.current && generation === generationRef.current) setError(getErrorMessage(loadError, "Gagal memuat halaman cache KELUHAN berikutnya.")); }
        finally { if (mountedRef.current && generation === generationRef.current) { loadingMoreRef.current = false; setLoadingMore(false); } }
    }, [db, initialLoading, keluhans.length, meta, refreshing, syncing]);
    const changeFilter = useCallback((status: KeluhanFilterStatus) => { if (filter === status) return; filterRef.current = status; setFilter(status); void loadFirstPage(); }, [filter, loadFirstPage]);
    const refreshAfterMutation = useCallback(async () => { await markKeluhanCacheDirty(db); await synchronizeKeluhanCache(db, true); await loadFirstPage(true); }, [db, loadFirstPage]);
    const handleDelete = async (id: number) => { const status = await getConnectivityStatus(); setConnectivity(status); if (status === "offline") { Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet."); return; } try { await keluhanService.deleteAdminKeluhan(id); try { await refreshAfterMutation(); Alert.alert("Sukses", "Data keluhan berhasil dihapus."); } catch { Alert.alert("Keluhan Terhapus", "Data terhapus di server, tetapi cache lokal belum berhasil diperbarui."); } } catch (mutationError) { Alert.alert("Error", getErrorMessage(mutationError, "Gagal menghapus keluhan.")); } };
    const handleUpdateStatus = async (id: number, status: "pending" | "proses" | "selesai") => { const connectivityStatus = await getConnectivityStatus(); setConnectivity(connectivityStatus); if (connectivityStatus === "offline") { Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet."); return; } try { await keluhanService.updateStatusKeluhan(id, { status_keluhan: status }); try { await refreshAfterMutation(); Alert.alert("Sukses", "Status keluhan berhasil diperbarui."); } catch { Alert.alert("Status Diperbarui", "Perubahan tersimpan di server, tetapi cache lokal belum berhasil diperbarui."); } } catch (mutationError) { Alert.alert("Error", getErrorMessage(mutationError, "Gagal memperbarui status.")); } };
    const handleExport = async (format: "csv" | "json") => { const status = await getConnectivityStatus(); setConnectivity(status); if (status === "offline") { Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet."); return; } try { setExporting(format); await keluhanService.exportAdminKeluhans({ format, status: filter }); } catch (exportError) { Alert.alert("Error", getErrorMessage(exportError, "Gagal mengunduh laporan. Pastikan backend berjalan dan Anda sudah login.")); } finally { setExporting(null); } };
    return { keluhans, meta, summary, loading: initialLoading, initialLoading, refreshing, loadingMore, syncing, connectivity, error, notice, filter, setFilter: changeFilter, fetchKeluhans: loadFirstPage, onRefresh: () => void syncAndReload(true, true, Boolean(meta)), loadMore, retry: () => void syncAndReload(true, false, Boolean(meta)), handleDelete, handleUpdateStatus, handleExport, exporting };
}
