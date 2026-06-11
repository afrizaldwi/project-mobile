import {
    getAdminDashboardSummary,
    getPenyewaDashboardSummary,
} from "@/api/dashboard";
import {
    clearDashboardStaging,
    insertDashboardStaging,
    markDashboardDirty,
    normalizeAdminDashboard,
    normalizePenyewaDashboard,
    publishDashboard,
} from "@/database/dashboardRepository";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import {
    getSafeErrorMessage,
    isRecoverableApiAvailabilityError,
} from "@/utils/apiErrors";
import type { SQLiteDatabase } from "expo-sqlite";

const active = new Map<string, Promise<void>>();

async function fetchAndValidateDashboard(
    scope: string,
    fetch: () => Promise<unknown>,
) {
    return scope === "admin"
        ? normalizeAdminDashboard(await fetch())
        : normalizePenyewaDashboard(await fetch());
}

async function persistDashboard(
    db: SQLiteDatabase,
    scope: string,
    payload: ReturnType<typeof normalizeAdminDashboard> | ReturnType<typeof normalizePenyewaDashboard>,
) {
    await clearDashboardStaging(db, scope);
    await insertDashboardStaging(db, scope, payload);
    await publishDashboard(db, scope);
}

async function synchronize(
    db: SQLiteDatabase,
    scope: string,
    fetch: () => Promise<unknown>,
) {
    try {
        const payload = await fetchAndValidateDashboard(scope, fetch);
        await withDatabaseSyncLock(`dashboard:${scope}`, () =>
            persistDashboard(db, scope, payload),
        );
    } catch (error) {
        await withDatabaseSyncLock(`dashboard:${scope}:failure`, async () => {
            await clearDashboardStaging(db, scope).catch(() => undefined);
            await markDashboardDirty(db, scope).catch(() => undefined);
        }).catch(() => undefined);
        if (__DEV__) {
            const details = { scope, message: getSafeErrorMessage(error) };
            if (isRecoverableApiAvailabilityError(error)) {
                console.warn("[DASHBOARD SYNC] Synchronization unavailable", details);
            } else {
                console.error("[DASHBOARD SYNC] Synchronization failed", details);
            }
        }
        throw error;
    }
}

function run(key: string, task: () => Promise<void>, force = false): Promise<void> {
    const current = active.get(key);
    if (current)
        return force
            ? current.catch(() => undefined).then(() => run(key, task))
            : current;
    const promise = task().finally(() => active.delete(key));
    active.set(key, promise);
    return promise;
}

export const syncAdminDashboard = (db: SQLiteDatabase, force = false) =>
    run("dashboard:admin", () => synchronize(db, "admin", getAdminDashboardSummary), force);

export const syncPenyewaDashboard = (
    db: SQLiteDatabase,
    userId: number,
    force = false,
) => {
    const scope = `penyewa:${userId}`;
    return run(
        `dashboard:${scope}`,
        () => synchronize(db, scope, getPenyewaDashboardSummary),
        force,
    );
};
