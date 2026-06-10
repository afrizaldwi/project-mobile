import { readDashboardSnapshot } from "@/database/dashboardRepository";
import { getConnectivityStatus } from "@/network/connectivity";
import type { AdminDashboardSummary, PenyewaDashboardSummary } from "@/types";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

type DashboardSummary = AdminDashboardSummary | PenyewaDashboardSummary;

export function useDashboardSnapshot<T extends DashboardSummary>(
    scope: string | null,
    sync: (force?: boolean) => Promise<void>,
) {
    const db = useSQLiteContext();
    const [summary, setSummary] = useState<T | null>(null);
    const [summaryScope, setSummaryScope] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(Boolean(scope));
    const [isRefreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const generation = useRef(0);

    const reload = useCallback(async (expectedScope: string, token: number) => {
        try {
            const payload = await readDashboardSnapshot(db, expectedScope);
            if (generation.current !== token) return false;
            setSummary(payload as T);
            setSummaryScope(expectedScope);
            setError("");
            return true;
        } catch (cause) {
            if (__DEV__)
                console.warn(
                    `[DASHBOARD UI] Local snapshot unavailable. Scope: ${expectedScope}`,
                    cause,
                );
            return false;
        }
    }, [db]);

    const refresh = useCallback(async (
        show = false,
        force = false,
        initialUsable = false,
    ) => {
        if (!scope) return;
        const token = generation.current;
        if (show) setRefreshing(true);
        let usable = initialUsable;
        try {
            if (await getConnectivityStatus() === "offline") {
                if (usable) {
                    setError("");
                    setNotice("Offline. Menampilkan dashboard yang tersimpan di perangkat.");
                } else {
                    setNotice("");
                    setError(
                        "Dashboard tersimpan tidak valid dan tidak dapat diperbarui saat offline.",
                    );
                }
                return;
            }
            await sync(force);
            if (generation.current !== token) return;
            usable = await reload(scope, token);
            if (generation.current === token) {
                if (!usable)
                    throw new Error("Dashboard hasil sinkronisasi tidak valid.");
                setError("");
                setNotice("");
            }
        } catch (cause) {
            if (generation.current !== token) return;
            if (usable) {
                setError("");
                setNotice("Sinkronisasi dashboard gagal. Menampilkan data tersimpan.");
            } else {
                setError("Dashboard belum tersedia dan sinkronisasi tidak dapat diselesaikan.");
            }
            if (__DEV__) console.error(`[DASHBOARD UI] Refresh failed. Scope: ${scope}`, cause);
        } finally {
            if (generation.current === token) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [reload, scope, sync]);

    useEffect(() => {
        const generationRef = generation;
        const token = ++generation.current;
        setSummary(null);
        setSummaryScope(null);
        setError("");
        setNotice("");
        setRefreshing(false);
        if (!scope) {
            setLoading(false);
            return;
        }
        setLoading(true);
        void (async () => {
            const usable = await reload(scope, token);
            if (generation.current !== token) return;
            if (usable) setLoading(false);
            if (generation.current === token) await refresh(false, false, usable);
        })().catch((cause) => {
            if (generation.current === token) {
                setError("Gagal menyiapkan dashboard lokal.");
                setLoading(false);
                if (__DEV__) console.error(`[DASHBOARD UI] Initial load failed. Scope: ${scope}`, cause);
            }
        });
        return () => {
            generationRef.current++;
        };
    }, [db, reload, refresh, scope]);

    return {
        summary: summaryScope === scope ? summary : null,
        isLoading,
        isRefreshing,
        error,
        notice,
        refresh: () =>
            void refresh(true, true, summaryScope === scope && summary !== null),
    };
}
