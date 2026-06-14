import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/auth/AuthContext";
import {
    getLocalPenyewaTamus,
    getPenyewaTamuMetadata,
    hasPenyewaTamuSnapshot,
} from "@/database/penyewaTamuRepository";
import { synchronizePenyewaTamuCache } from "@/database/penyewaTamuSync";
import { getConnectivityStatus } from "@/network/connectivity";
import type { Tamu } from "@/types";
import { getErrorMessage, isFresh } from "@/utils/helpers";

const CACHE_FRESHNESS_MS = 5 * 60 * 1000;

export function usePenyewaTamus() {
    const db = useSQLiteContext();
    const { user } = useAuth();
    const scope = user ? `penyewa:${user.id}` : null;
    const [tamus, setTamus] = useState<Tamu[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [dataScope, setDataScope] = useState<string | null>(null);
    const mountedRef = useRef(false);
    const focusedRef = useRef(false);
    const generationRef = useRef(0);

    const loadLocal = useCallback(
        async (targetScope: string, generation: number) => {
            try {
                const rows = await getLocalPenyewaTamus(db, targetScope);
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return false;
                setTamus(rows);
                setDataScope(targetScope);
                setError(null);
                return true;
            } catch (loadError) {
                if (
                    mountedRef.current &&
                    focusedRef.current &&
                    generation === generationRef.current
                ) {
                    setError(
                        getErrorMessage(
                            loadError,
                            "Gagal membaca cache TAMU penyewa lokal.",
                        ),
                    );
                }
                return false;
            }
        },
        [db],
    );

    const syncAndReload = useCallback(
        async (
            targetScope: string,
            force: boolean,
            showRefresh = false,
            cacheUsable = true,
        ) => {
            const generation = generationRef.current;
            if (mountedRef.current && showRefresh) setRefreshing(true);
            try {
                if (!force) {
                    const metadata = await getPenyewaTamuMetadata(db, targetScope);
                    if (cacheUsable && !metadata.isDirty && isFresh(metadata.lastSyncedAt, CACHE_FRESHNESS_MS))
                        return;
                }
                const status = await getConnectivityStatus();
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                if (status === "offline") {
                    if (!cacheUsable)
                        setError("Offline dan belum ada data TAMU tersimpan di perangkat.");
                    else
                        setNotice(
                            showRefresh
                                ? "Penyegaran membutuhkan koneksi internet. Cache lama tetap ditampilkan."
                                : "Offline. Menampilkan data TAMU yang tersimpan di perangkat.",
                        );
                    return;
                }
                await synchronizePenyewaTamuCache(db, targetScope, force);
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                setNotice(null);
                await loadLocal(targetScope, generation);
            } catch (syncError) {
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                const message = cacheUsable
                    ? "Sinkronisasi TAMU gagal. Cache lama tetap digunakan."
                    : "Data TAMU belum tersedia dan sinkronisasi tidak dapat diselesaikan.";
                if (cacheUsable) {
                    setError(null);
                    setNotice(message);
                } else {
                    setNotice(null);
                    setError(getErrorMessage(syncError, message));
                }
            } finally {
                if (
                    mountedRef.current &&
                    focusedRef.current &&
                    generation === generationRef.current
                ) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [db, loadLocal],
    );

    useFocusEffect(
        useCallback(() => {
            mountedRef.current = true;
            focusedRef.current = true;
            generationRef.current += 1;
            const generation = generationRef.current;
            setTamus([]);
            setDataScope(null);
            setError(null);
            setNotice(null);
            setRefreshing(false);
            if (!scope) {
                setLoading(false);
                return () => {
                    focusedRef.current = false;
                    generationRef.current += 1;
                };
            }
            setLoading(true);
            void (async () => {
                const snapshot = await hasPenyewaTamuSnapshot(db, scope);
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                if (snapshot) {
                    const loaded = await loadLocal(scope, generation);
                    if (
                        mountedRef.current &&
                        focusedRef.current &&
                        generation === generationRef.current &&
                        loaded
                    )
                        setLoading(false);
                    await syncAndReload(scope, false, false, loaded);
                    return;
                }
                await syncAndReload(scope, false, false, false);
            })().catch((focusError) => {
                if (
                    mountedRef.current &&
                    focusedRef.current &&
                    generation === generationRef.current
                ) {
                    setError(
                        getErrorMessage(
                            focusError,
                            "Gagal menyiapkan cache TAMU penyewa.",
                        ),
                    );
                    setLoading(false);
                }
            });
            return () => {
                focusedRef.current = false;
                generationRef.current += 1;
            };
        }, [db, loadLocal, scope, syncAndReload]),
    );

    return {
        tamus: dataScope === scope ? tamus : [],
        loading,
        refreshing,
        error,
        notice,
        refresh: () => {
            if (!scope) return;
            void syncAndReload(scope, true, true, dataScope === scope);
        },
    };
}
