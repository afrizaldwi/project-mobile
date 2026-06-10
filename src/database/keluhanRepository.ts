import type { SQLiteDatabase } from "expo-sqlite";

import type { Keluhan } from "@/types";
import type { AdminKeluhanListResponse, AdminKeluhanStatus, AdminKeluhanSummary } from "@/types/keluhan";

const KELUHAN_RESOURCE = "keluhan";
type CountRow = { count: number };
type SyncMetadataRow = { last_synced_at: string; is_dirty: number };

function buildStatusFilter(status: AdminKeluhanStatus) {
    if (status === "semua") return { sql: "", values: [] as string[] };
    return { sql: "WHERE status_keluhan = ?", values: [status] };
}

export async function getLocalKeluhanPage(db: SQLiteDatabase, params: { page: number; per_page: number; status: AdminKeluhanStatus }): Promise<AdminKeluhanListResponse> {
    const page = Math.max(1, params.page); const perPage = Math.max(1, params.per_page); const offset = (page - 1) * perPage;
    const filter = buildStatusFilter(params.status);
    const [rows, countRow, summaryRow] = await Promise.all([
        db.getAllAsync<Keluhan>(`SELECT id_keluhan, id_sewa, judul_keluhan, deskripsi_keluhan, foto_kerusakan, foto_kerusakan_url, status_keluhan, tanggal_lapor, tanggal_selesai, nama_penghuni, email_penghuni, nomor_kamar FROM keluhan_cache ${filter.sql} ORDER BY tanggal_lapor DESC, id_keluhan DESC LIMIT ? OFFSET ?`, [...filter.values, perPage, offset]),
        db.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM keluhan_cache ${filter.sql}`, filter.values),
        db.getFirstAsync<AdminKeluhanSummary>(`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status_keluhan = 'pending' THEN 1 ELSE 0 END), 0) AS pending, COALESCE(SUM(CASE WHEN status_keluhan = 'proses' THEN 1 ELSE 0 END), 0) AS proses, COALESCE(SUM(CASE WHEN status_keluhan = 'selesai' THEN 1 ELSE 0 END), 0) AS selesai FROM keluhan_cache ${filter.sql}`, filter.values),
    ]);
    const total = countRow?.count ?? 0;
    return { data: rows, meta: { current_page: page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)), from: rows.length ? offset + 1 : null, to: rows.length ? offset + rows.length : null }, summary: summaryRow ?? { total: 0, pending: 0, proses: 0, selesai: 0 } };
}
export async function hasKeluhanSnapshot(db: SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<SyncMetadataRow>("SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?", KELUHAN_RESOURCE);
    return Boolean(row?.last_synced_at);
}
export async function getKeluhanSyncMetadata(db: SQLiteDatabase): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<SyncMetadataRow>("SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?", KELUHAN_RESOURCE);
    return { lastSyncedAt: row?.last_synced_at || null, isDirty: row?.is_dirty === 1 };
}
export async function markKeluhanCacheDirty(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(`INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1) ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`, KELUHAN_RESOURCE);
}
export async function clearKeluhanStaging(db: SQLiteDatabase): Promise<void> { await db.runAsync("DELETE FROM keluhan_cache_staging"); }
export async function insertKeluhanStagingPage(db: SQLiteDatabase, items: Keluhan[]): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const item of items) await txn.runAsync(`INSERT INTO keluhan_cache_staging (id_keluhan, id_sewa, judul_keluhan, deskripsi_keluhan, foto_kerusakan, foto_kerusakan_url, status_keluhan, tanggal_lapor, tanggal_selesai, nama_penghuni, email_penghuni, nomor_kamar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item.id_keluhan, item.id_sewa, item.judul_keluhan, item.deskripsi_keluhan, item.foto_kerusakan ?? null, item.foto_kerusakan_url ?? null, item.status_keluhan, item.tanggal_lapor, item.tanggal_selesai ?? null, item.nama_penghuni, item.email_penghuni, item.nomor_kamar);
    });
}
export async function getKeluhanStagingCount(db: SQLiteDatabase): Promise<number> { return (await db.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM keluhan_cache_staging"))?.count ?? 0; }
export async function publishKeluhanStaging(db: SQLiteDatabase, expectedCount: number, syncedAt: string): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        const count = (await txn.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM keluhan_cache_staging"))?.count ?? 0;
        if (count !== expectedCount) throw new Error("Jumlah staging KELUHAN berubah sebelum publikasi.");
        await txn.runAsync("DELETE FROM keluhan_cache");
        await txn.runAsync("INSERT INTO keluhan_cache SELECT * FROM keluhan_cache_staging");
        await txn.runAsync(`INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, ?, 0) ON CONFLICT(resource_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, is_dirty = 0`, KELUHAN_RESOURCE, syncedAt);
        await txn.runAsync("DELETE FROM keluhan_cache_staging");
    });
}
