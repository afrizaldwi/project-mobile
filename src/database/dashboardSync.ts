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
import type { SQLiteDatabase } from "expo-sqlite";

const active = new Map<string, Promise<void>>();

async function synchronize(
    db: SQLiteDatabase,
    scope: string,
    fetch: () => Promise<unknown>,
) {
    try {
        await clearDashboardStaging(db, scope);
        const payload = scope === "admin"
            ? normalizeAdminDashboard(await fetch())
            : normalizePenyewaDashboard(await fetch());
        await insertDashboardStaging(db, scope, payload);
        await publishDashboard(db, scope);
    } catch (error) {
        await clearDashboardStaging(db, scope).catch(() => undefined);
        await markDashboardDirty(db, scope).catch(() => undefined);
        if (__DEV__)
            console.error(`[DASHBOARD SYNC] Synchronization failed. Scope: ${scope}`, error);
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
