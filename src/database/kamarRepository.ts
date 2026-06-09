import type { SQLiteDatabase } from "expo-sqlite";

import type { Kamar, KamarApiItem, KamarListParams, KamarListResponse, KamarStats } from "@/types/kamar";

const KAMAR_RESOURCE = "kamar";

type KamarCacheRow = Kamar;
type CountRow = { count: number };
type StatsRow = KamarStats;
type SyncMetadataRow = { last_synced_at: string; is_dirty: number };

function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&");
}

function mapRowToKamar(row: KamarCacheRow): Kamar {
    if (!/^\d+(?:\.\d+)?$/.test(row.harga_bulanan)) {
        throw new Error(`Harga kamar ${row.id_kamar} di cache tidak valid.`);
    }
    return row;
}

function buildFilter(params: Pick<KamarListParams, "search" | "status">) {
    const clauses: string[] = [];
    const values: (string | number)[] = [];

    if (params.status && params.status !== "semua") {
        clauses.push("status_kamar = ?");
        values.push(params.status);
    }
    if (params.search?.trim()) {
        clauses.push("nomor_kamar LIKE ? ESCAPE '\\' COLLATE NOCASE");
        values.push(`%${escapeLike(params.search.trim())}%`);
    }
    return { sql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "", values };
}

export async function getLocalKamarPage(db: SQLiteDatabase, params: KamarListParams): Promise<KamarListResponse> {
    const page = Math.max(1, params.page);
    const perPage = Math.max(1, params.per_page);
    const offset = (page - 1) * perPage;
    const filter = buildFilter(params);

    const [rows, countRow, statsRow] = await Promise.all([
        db.getAllAsync<KamarCacheRow>(
            `SELECT id_kamar, nomor_kamar, luas_kamar, fasilitas, harga_bulanan,
                    status_kamar, foto_kamar, created_at, updated_at
             FROM kamar_cache ${filter.sql}
             ORDER BY nomor_kamar COLLATE NOCASE ASC, id_kamar ASC LIMIT ? OFFSET ?`,
            [...filter.values, perPage, offset]
        ),
        db.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM kamar_cache ${filter.sql}`, filter.values),
        db.getFirstAsync<StatsRow>(`
            SELECT COUNT(*) AS total,
                COALESCE(SUM(CASE WHEN status_kamar = 'tersedia' THEN 1 ELSE 0 END), 0) AS tersedia,
                COALESCE(SUM(CASE WHEN status_kamar = 'terisi' THEN 1 ELSE 0 END), 0) AS terisi,
                COALESCE(SUM(CASE WHEN status_kamar = 'perbaikan' THEN 1 ELSE 0 END), 0) AS perbaikan
            FROM kamar_cache`),
    ]);

    const filteredTotal = countRow?.count ?? 0;
    return {
        data: rows.map(mapRowToKamar),
        meta: {
            current_page: page,
            per_page: perPage,
            total: filteredTotal,
            last_page: Math.max(1, Math.ceil(filteredTotal / perPage)),
            from: rows.length > 0 ? offset + 1 : null,
            to: rows.length > 0 ? offset + rows.length : null,
        },
        ...(statsRow ?? { total: 0, tersedia: 0, terisi: 0, perbaikan: 0 }),
    };
}

export async function hasKamarCache(db: SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM kamar_cache");
    return (row?.count ?? 0) > 0;
}

export async function getKamarSyncMetadata(db: SQLiteDatabase): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<SyncMetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        KAMAR_RESOURCE
    );
    return { lastSyncedAt: row?.last_synced_at ?? null, isDirty: row?.is_dirty === 1 };
}

export async function getKamarLastSyncedAt(db: SQLiteDatabase): Promise<string | null> {
    return (await getKamarSyncMetadata(db)).lastSyncedAt;
}

export async function markKamarCacheDirty(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1)
         ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`,
        KAMAR_RESOURCE
    );
}

export async function deleteCachedKamar(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync("DELETE FROM kamar_cache WHERE id_kamar = ?", id);
}

export async function clearKamarStaging(db: SQLiteDatabase): Promise<void> {
    await db.runAsync("DELETE FROM kamar_cache_staging");
}

export async function insertKamarStagingPage(db: SQLiteDatabase, items: KamarApiItem[]): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const item of items) {
            await txn.runAsync(
                `INSERT INTO kamar_cache_staging (
                    id_kamar, nomor_kamar, luas_kamar, fasilitas, harga_bulanan,
                    status_kamar, foto_kamar, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                item.id_kamar, item.nomor_kamar, item.luas_kamar, item.fasilitas,
                item.harga_bulanan, item.status_kamar, item.foto_kamar, item.created_at, item.updated_at
            );
        }
    });
}

export async function getKamarStagingCount(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM kamar_cache_staging");
    return row?.count ?? 0;
}

export async function publishKamarStaging(db: SQLiteDatabase, syncedAt: string): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync("DELETE FROM kamar_cache");
        await txn.runAsync(`
            INSERT INTO kamar_cache (
                id_kamar, nomor_kamar, luas_kamar, fasilitas, harga_bulanan,
                status_kamar, foto_kamar, created_at, updated_at, sync_run_id
            )
            SELECT id_kamar, nomor_kamar, luas_kamar, fasilitas, harga_bulanan,
                status_kamar, foto_kamar, created_at, updated_at, ?
            FROM kamar_cache_staging`, syncedAt);
        await txn.runAsync(
            `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, ?, 0)
             ON CONFLICT(resource_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, is_dirty = 0`,
            KAMAR_RESOURCE, syncedAt
        );
        await txn.runAsync("DELETE FROM kamar_cache_staging");
    });
}
