import type { SQLiteDatabase } from "expo-sqlite";

import type { AdminPenghuniItem, AdminPenghuniItemStatus, AdminPenghuniListResponse } from "@/types/penghuni";
import { escapeLike } from "@/database/database";

const PENGHUNI_RESOURCE = "penghuni";
type CountRow = { count: number };
type SyncMetadataRow = { last_synced_at: string; is_dirty: number };
type PenghuniCacheRow = {
    id_sewa: number; tanggal_masuk: string; tanggal_keluar: string | null; harga_deal: string;
    durasi_sewa_bulan: number; status_sewa: AdminPenghuniItemStatus; user_id: number | null;
    user_nama_lengkap: string | null; user_email: string | null; user_no_hp: string | null;
    user_alamat_asal: string | null; user_foto_profil: string | null; kamar_id: number | null;
    kamar_nomor_kamar: string | null; kamar_fasilitas: string | null; kamar_harga_bulanan: string | null;
    kamar_luas_kamar: string | null; kamar_foto_kamar: string | null; kamar_status_kamar: string | null;
};
export type PenghuniLocalFilterStatus = "aktif" | "selesai" | "all";
function buildFilter(params: { search?: string; status: PenghuniLocalFilterStatus }) {
    const clauses: string[] = [];
    const values: string[] = [];
    if (params.status !== "all") { clauses.push("status_sewa = ?"); values.push(params.status); }
    const search = params.search?.trim().slice(0, 100);
    if (search) {
        const value = `%${escapeLike(search)}%`;
        clauses.push(`(user_nama_lengkap LIKE ? ESCAPE '\\' COLLATE NOCASE OR user_email LIKE ? ESCAPE '\\' COLLATE NOCASE OR user_no_hp LIKE ? ESCAPE '\\' COLLATE NOCASE OR kamar_nomor_kamar LIKE ? ESCAPE '\\' COLLATE NOCASE)`);
        values.push(value, value, value, value);
    }
    return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
}
function mapRow(row: PenghuniCacheRow): AdminPenghuniItem {
    return {
        id_sewa: row.id_sewa, tanggal_masuk: row.tanggal_masuk, tanggal_keluar: row.tanggal_keluar,
        harga_deal: row.harga_deal, durasi_sewa_bulan: row.durasi_sewa_bulan, status_sewa: row.status_sewa,
        user: { id: row.user_id, nama_lengkap: row.user_nama_lengkap, email: row.user_email, no_hp: row.user_no_hp, alamat_asal: row.user_alamat_asal, foto_profil: row.user_foto_profil },
        kamar: { id_kamar: row.kamar_id, nomor_kamar: row.kamar_nomor_kamar, fasilitas: row.kamar_fasilitas, harga_bulanan: row.kamar_harga_bulanan, luas_kamar: row.kamar_luas_kamar, foto_kamar: row.kamar_foto_kamar, status_kamar: row.kamar_status_kamar },
    };
}
export async function getLocalPenghuniPage(db: SQLiteDatabase, params: { page: number; per_page: number; search?: string; status: PenghuniLocalFilterStatus }): Promise<AdminPenghuniListResponse> {
    const page = Math.max(1, params.page); const perPage = Math.max(1, params.per_page); const offset = (page - 1) * perPage;
    const filter = buildFilter(params);
    const [rows, countRow] = await Promise.all([
        // The backend has no tie-breaker for equal dates, so equal-date order may differ locally.
        db.getAllAsync<PenghuniCacheRow>(`SELECT * FROM penghuni_cache ${filter.sql} ORDER BY tanggal_masuk DESC, id_sewa DESC LIMIT ? OFFSET ?`, [...filter.values, perPage, offset]),
        db.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM penghuni_cache ${filter.sql}`, filter.values),
    ]);
    const total = countRow?.count ?? 0;
    return { data: rows.map(mapRow), meta: { current_page: page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)), from: rows.length ? offset + 1 : null, to: rows.length ? offset + rows.length : null } };
}
export async function hasPenghuniSnapshot(db: SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<SyncMetadataRow>("SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?", PENGHUNI_RESOURCE);
    return Boolean(row?.last_synced_at);
}
export async function getPenghuniSyncMetadata(db: SQLiteDatabase): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<SyncMetadataRow>("SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?", PENGHUNI_RESOURCE);
    return { lastSyncedAt: row?.last_synced_at || null, isDirty: row?.is_dirty === 1 };
}
export async function markPenghuniCacheDirty(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(`INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1) ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`, PENGHUNI_RESOURCE);
}
export async function clearPenghuniStaging(db: SQLiteDatabase): Promise<void> { await db.runAsync("DELETE FROM penghuni_cache_staging"); }
export async function insertPenghuniStagingPage(db: SQLiteDatabase, items: AdminPenghuniItem[]): Promise<void> {
    if (items.length === 0) return;
    await db.withExclusiveTransactionAsync(async (txn) => {
        const cols = "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const placeholders = items.map(() => cols).join(", ");
        const values: (string | number | null)[] = [];
        for (const item of items) {
            values.push(item.id_sewa, item.tanggal_masuk, item.tanggal_keluar, item.harga_deal, item.durasi_sewa_bulan, item.status_sewa, item.user.id, item.user.nama_lengkap, item.user.email, item.user.no_hp, item.user.alamat_asal, item.user.foto_profil, item.kamar.id_kamar, item.kamar.nomor_kamar, item.kamar.fasilitas, item.kamar.harga_bulanan, item.kamar.luas_kamar, item.kamar.foto_kamar, item.kamar.status_kamar);
        }
        await txn.runAsync(
            `INSERT INTO penghuni_cache_staging (id_sewa, tanggal_masuk, tanggal_keluar, harga_deal, durasi_sewa_bulan, status_sewa, user_id, user_nama_lengkap, user_email, user_no_hp, user_alamat_asal, user_foto_profil, kamar_id, kamar_nomor_kamar, kamar_fasilitas, kamar_harga_bulanan, kamar_luas_kamar, kamar_foto_kamar, kamar_status_kamar) VALUES ${placeholders}`,
            ...values,
        );
    });
}
export async function getPenghuniStagingCount(db: SQLiteDatabase): Promise<number> { return (await db.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM penghuni_cache_staging"))?.count ?? 0; }
export async function publishPenghuniStaging(db: SQLiteDatabase, expectedCount: number, syncedAt: string): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        const count = (await txn.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM penghuni_cache_staging"))?.count ?? 0;
        if (count !== expectedCount) throw new Error("Jumlah staging PENGHUNI berubah sebelum publikasi.");
        await txn.runAsync("DELETE FROM penghuni_cache");
        await txn.runAsync("INSERT INTO penghuni_cache SELECT * FROM penghuni_cache_staging");
        await txn.runAsync(`INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, ?, 0) ON CONFLICT(resource_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, is_dirty = 0`, PENGHUNI_RESOURCE, syncedAt);
        await txn.runAsync("DELETE FROM penghuni_cache_staging");
    });
}
