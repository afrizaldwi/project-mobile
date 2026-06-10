import type { SQLiteDatabase } from "expo-sqlite";

import type { Tamu } from "@/types";

type CountRow = { count: number };
type MetadataRow = { last_synced_at: string; is_dirty: number };

const resource = (scope: string) => `tamu:${scope}`;

export async function getLocalPenyewaTamus(
    db: SQLiteDatabase,
    scope: string,
): Promise<Tamu[]> {
    return db.getAllAsync<Tamu>(
        `SELECT id_tamu, nama_tamu, no_hp_tamu, keperluan, waktu_berkunjung,
                id_user, nama_penghuni, nomor_kamar
         FROM penyewa_tamu_cache
         WHERE scope_key = ?
         ORDER BY waktu_berkunjung DESC, id_tamu DESC`,
        scope,
    );
}

export async function hasPenyewaTamuSnapshot(
    db: SQLiteDatabase,
    scope: string,
): Promise<boolean> {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        resource(scope),
    );
    return Boolean(row?.last_synced_at);
}

export async function getPenyewaTamuMetadata(
    db: SQLiteDatabase,
    scope: string,
): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        resource(scope),
    );
    return { lastSyncedAt: row?.last_synced_at || null, isDirty: row?.is_dirty === 1 };
}

export async function markPenyewaTamuDirty(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1)
         ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`,
        resource(scope),
    );
}

export async function clearPenyewaTamuStaging(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    await db.runAsync(
        "DELETE FROM penyewa_tamu_cache_staging WHERE scope_key = ?",
        scope,
    );
}

export async function insertPenyewaTamuStaging(
    db: SQLiteDatabase,
    scope: string,
    items: Tamu[],
): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const item of items) {
            await txn.runAsync(
                `INSERT INTO penyewa_tamu_cache_staging (
                    scope_key, id_tamu, nama_tamu, no_hp_tamu, keperluan,
                    waktu_berkunjung, id_user, nama_penghuni, nomor_kamar
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                scope,
                item.id_tamu,
                item.nama_tamu,
                item.no_hp_tamu,
                item.keperluan,
                item.waktu_berkunjung,
                item.id_user,
                item.nama_penghuni,
                item.nomor_kamar,
            );
        }
    });
}

export async function getPenyewaTamuStagingCount(
    db: SQLiteDatabase,
    scope: string,
): Promise<number> {
    return (
        (
            await db.getFirstAsync<CountRow>(
                "SELECT COUNT(*) AS count FROM penyewa_tamu_cache_staging WHERE scope_key = ?",
                scope,
            )
        )?.count ?? 0
    );
}

export async function publishPenyewaTamuStaging(
    db: SQLiteDatabase,
    scope: string,
    expectedCount: number,
    syncedAt: string,
): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        const count =
            (
                await txn.getFirstAsync<CountRow>(
                    "SELECT COUNT(*) AS count FROM penyewa_tamu_cache_staging WHERE scope_key = ?",
                    scope,
                )
            )?.count ?? 0;
        if (count !== expectedCount)
            throw new Error("Jumlah staging TAMU penyewa berubah sebelum publikasi.");
        await txn.runAsync(
            "DELETE FROM penyewa_tamu_cache WHERE scope_key = ?",
            scope,
        );
        await txn.runAsync(
            `INSERT INTO penyewa_tamu_cache (
                scope_key, id_tamu, nama_tamu, no_hp_tamu, keperluan,
                waktu_berkunjung, id_user, nama_penghuni, nomor_kamar
            )
            SELECT
                scope_key, id_tamu, nama_tamu, no_hp_tamu, keperluan,
                waktu_berkunjung, id_user, nama_penghuni, nomor_kamar
            FROM penyewa_tamu_cache_staging
            WHERE scope_key = ?`,
            scope,
        );
        await txn.runAsync(
            `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, ?, 0)
             ON CONFLICT(resource_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, is_dirty = 0`,
            resource(scope),
            syncedAt,
        );
        await txn.runAsync(
            "DELETE FROM penyewa_tamu_cache_staging WHERE scope_key = ?",
            scope,
        );
    });
}
