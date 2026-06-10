import type { SQLiteDatabase } from "expo-sqlite";

import type { AdminTamuItem, AdminTamuListResponse, AdminTamuSummary } from "@/types/tamu";

const TAMU_RESOURCE = "tamu";
type CountRow = { count: number };
type SyncMetadataRow = { last_synced_at: string; is_dirty: number };
export type TamuStagingItem = AdminTamuItem & { visit_date_jakarta: string };

function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&");
}

function buildSearchFilter(search?: string) {
    const trimmed = search?.trim().slice(0, 100);
    if (!trimmed) return { sql: "", values: [] as string[] };
    const value = `%${escapeLike(trimmed)}%`;
    return {
        sql: `WHERE (
            nama_tamu LIKE ? ESCAPE '\\' COLLATE NOCASE OR
            no_hp_tamu LIKE ? ESCAPE '\\' COLLATE NOCASE OR
            keperluan LIKE ? ESCAPE '\\' COLLATE NOCASE OR
            nama_penghuni LIKE ? ESCAPE '\\' COLLATE NOCASE OR
            nomor_kamar LIKE ? ESCAPE '\\' COLLATE NOCASE
        )`,
        values: [value, value, value, value, value],
    };
}

export async function getLocalTamuPage(
    db: SQLiteDatabase,
    params: { page: number; per_page: number; search?: string },
    jakartaToday: string
): Promise<AdminTamuListResponse> {
    const page = Math.max(1, params.page);
    const perPage = Math.max(1, params.per_page);
    const offset = (page - 1) * perPage;
    const filter = buildSearchFilter(params.search);
    const [rows, countRow, summaryRow] = await Promise.all([
        db.getAllAsync<AdminTamuItem>(
            `SELECT id_tamu, nama_tamu, no_hp_tamu, keperluan, waktu_berkunjung,
                    id_user, nama_penghuni, nomor_kamar
             FROM tamu_cache ${filter.sql}
             ORDER BY waktu_berkunjung DESC, id_tamu DESC LIMIT ? OFFSET ?`,
            [...filter.values, perPage, offset]
        ),
        db.getFirstAsync<CountRow>(`SELECT COUNT(*) AS count FROM tamu_cache ${filter.sql}`, filter.values),
        db.getFirstAsync<AdminTamuSummary>(
            `SELECT COUNT(*) AS total_tamu,
                    COUNT(DISTINCT id_user) AS total_penghuni_visited,
                    COALESCE(SUM(CASE WHEN visit_date_jakarta = ? THEN 1 ELSE 0 END), 0) AS tamu_today
             FROM tamu_cache ${filter.sql}`,
            [jakartaToday, ...filter.values]
        ),
    ]);
    const total = countRow?.count ?? 0;
    return {
        data: rows,
        meta: {
            current_page: page,
            per_page: perPage,
            total,
            last_page: Math.max(1, Math.ceil(total / perPage)),
            from: rows.length > 0 ? offset + 1 : null,
            to: rows.length > 0 ? offset + rows.length : null,
        },
        summary: summaryRow ?? { total_tamu: 0, total_penghuni_visited: 0, tamu_today: 0 },
    };
}

export async function hasTamuCache(db: SQLiteDatabase): Promise<boolean> {
    const row = await db.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM tamu_cache");
    return (row?.count ?? 0) > 0;
}

export async function getTamuSyncMetadata(db: SQLiteDatabase): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<SyncMetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        TAMU_RESOURCE
    );
    return { lastSyncedAt: row?.last_synced_at || null, isDirty: row?.is_dirty === 1 };
}

export async function markTamuCacheDirty(db: SQLiteDatabase): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1)
         ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`,
        TAMU_RESOURCE
    );
}

export async function clearTamuStaging(db: SQLiteDatabase): Promise<void> {
    await db.runAsync("DELETE FROM tamu_cache_staging");
}

export async function insertTamuStagingPage(db: SQLiteDatabase, items: TamuStagingItem[]): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const item of items) {
            await txn.runAsync(
                `INSERT INTO tamu_cache_staging (
                    id_tamu, nama_tamu, no_hp_tamu, keperluan, waktu_berkunjung,
                    visit_date_jakarta, id_user, nama_penghuni, nomor_kamar
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                item.id_tamu, item.nama_tamu, item.no_hp_tamu, item.keperluan,
                item.waktu_berkunjung, item.visit_date_jakarta, item.id_user,
                item.nama_penghuni, item.nomor_kamar
            );
        }
    });
}

export async function getTamuStagingCount(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM tamu_cache_staging");
    return row?.count ?? 0;
}

export async function publishTamuStaging(db: SQLiteDatabase, expectedCount: number, syncedAt: string): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        const row = await txn.getFirstAsync<CountRow>("SELECT COUNT(*) AS count FROM tamu_cache_staging");
        if ((row?.count ?? 0) !== expectedCount) throw new Error("Jumlah staging TAMU berubah sebelum publikasi.");
        await txn.runAsync("DELETE FROM tamu_cache");
        await txn.runAsync(`
            INSERT INTO tamu_cache (
                id_tamu, nama_tamu, no_hp_tamu, keperluan, waktu_berkunjung,
                visit_date_jakarta, id_user, nama_penghuni, nomor_kamar
            )
            SELECT id_tamu, nama_tamu, no_hp_tamu, keperluan, waktu_berkunjung,
                visit_date_jakarta, id_user, nama_penghuni, nomor_kamar
            FROM tamu_cache_staging`);
        await txn.runAsync(
            `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, ?, 0)
             ON CONFLICT(resource_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, is_dirty = 0`,
            TAMU_RESOURCE, syncedAt
        );
        await txn.runAsync("DELETE FROM tamu_cache_staging");
    });
}
