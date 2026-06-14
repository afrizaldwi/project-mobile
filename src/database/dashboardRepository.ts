import type { SQLiteDatabase } from "expo-sqlite";

import {
    normalizeAdminDashboard,
    normalizePenyewaDashboard,
    refreshPenyewaDashboardContract,
} from "@/database/dashboardSnapshot";
import type {
    AdminDashboardSummary,
    PenyewaDashboardSummary,
} from "@/types/dashboard";

type MetadataRow = { last_synced_at: string; is_dirty: number };
type PayloadRow = { payload_json: string };
type DashboardSummary = AdminDashboardSummary | PenyewaDashboardSummary;

const resource = (scope: string) => `dashboard:${scope}`;

export async function readDashboardSnapshot(
    db: SQLiteDatabase,
    scope: string,
): Promise<DashboardSummary> {
    const row = await db.getFirstAsync<PayloadRow>(
        "SELECT payload_json FROM dashboard_cache WHERE scope_key=?",
        scope,
    );
    if (!row) throw new Error("Snapshot dashboard belum tersedia.");
    try {
        const parsed = JSON.parse(row.payload_json);
        return scope === "admin"
            ? normalizeAdminDashboard(parsed)
            : refreshPenyewaDashboardContract(normalizePenyewaDashboard(parsed));
    } catch (error) {
        if (__DEV__)
            console.error(
                `[DASHBOARD CACHE] Invalid cached JSON. Scope: ${scope}`,
                error,
            );
        throw new Error("Snapshot dashboard lokal tidak valid.");
    }
}

export async function hasDashboardSnapshot(db: SQLiteDatabase, scope: string) {
    return Boolean(
        await db.getFirstAsync(
            "SELECT 1 FROM dashboard_cache WHERE scope_key=?",
            scope,
        ),
    );
}

export async function getDashboardMetadata(db: SQLiteDatabase, scope: string) {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at,is_dirty FROM sync_metadata WHERE resource_name=?",
        resource(scope),
    );
    return {
        lastSyncedAt: row?.last_synced_at || null,
        isDirty: row?.is_dirty === 1,
    };
}

export async function markDashboardDirty(db: SQLiteDatabase, scope: string) {
    await db.runAsync(
        "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,'',1) ON CONFLICT(resource_name) DO UPDATE SET is_dirty=1",
        resource(scope),
    );
}

export async function clearDashboardStaging(db: SQLiteDatabase, scope: string) {
    await db.runAsync(
        "DELETE FROM dashboard_cache_staging WHERE scope_key=?",
        scope,
    );
}

export async function insertDashboardStaging(
    db: SQLiteDatabase,
    scope: string,
    payload: DashboardSummary,
) {
    await db.runAsync(
        "INSERT OR REPLACE INTO dashboard_cache_staging(scope_key,payload_json) VALUES(?,?)",
        scope,
        JSON.stringify(payload),
    );
}

export async function publishDashboard(db: SQLiteDatabase, scope: string) {
    await db.withExclusiveTransactionAsync(async (txn) => {
        const staged = await txn.getFirstAsync<PayloadRow>(
            "SELECT payload_json FROM dashboard_cache_staging WHERE scope_key=?",
            scope,
        );
        if (!staged) throw new Error("Snapshot staging dashboard tidak tersedia.");
        await txn.runAsync(
            "INSERT OR REPLACE INTO dashboard_cache(scope_key,payload_json) VALUES(?,?)",
            scope,
            staged.payload_json,
        );
        await txn.runAsync(
            "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,?,0) ON CONFLICT(resource_name) DO UPDATE SET last_synced_at=excluded.last_synced_at,is_dirty=0",
            resource(scope),
            new Date().toISOString(),
        );
        await txn.runAsync(
            "DELETE FROM dashboard_cache_staging WHERE scope_key=?",
            scope,
        );
    });
}
