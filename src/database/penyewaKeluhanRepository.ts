import type { SQLiteDatabase } from "expo-sqlite";

import type { Keluhan } from "@/types";

type CountRow = { count: number };
type MetadataRow = { last_synced_at: string; is_dirty: number };

const resource = (scope: string) => `keluhan:${scope}`;

export async function getLocalPenyewaKeluhans(
    db: SQLiteDatabase,
    scope: string,
): Promise<Keluhan[]> {
    return db.getAllAsync<Keluhan>(
        `SELECT id_keluhan, id_sewa, judul_keluhan, deskripsi_keluhan, foto_kerusakan, foto_kerusakan_url, status_keluhan, tanggal_lapor, tanggal_selesai, nama_penghuni, email_penghuni, nomor_kamar
         FROM penyewa_keluhan_cache
         WHERE scope_key = ?
         ORDER BY tanggal_lapor DESC, id_keluhan DESC`,
        scope,
    );
}

export async function hasPenyewaKeluhanSnapshot(
    db: SQLiteDatabase,
    scope: string,
): Promise<boolean> {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        resource(scope),
    );
    return Boolean(row?.last_synced_at);
}

export async function getPenyewaKeluhanMetadata(
    db: SQLiteDatabase,
    scope: string,
): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        resource(scope),
    );
    return { lastSyncedAt: row?.last_synced_at || null, isDirty: row?.is_dirty === 1 };
}

export async function markPenyewaKeluhanDirty(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1)
         ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`,
        resource(scope),
    );
}

export async function clearPenyewaKeluhanStaging(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    await db.runAsync(
        "DELETE FROM penyewa_keluhan_cache_staging WHERE scope_key = ?",
        scope,
    );
}

export async function insertPenyewaKeluhanStaging(
    db: SQLiteDatabase,
    scope: string,
    items: Keluhan[],
): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        for (const item of items) {
            await txn.runAsync(
                `INSERT INTO penyewa_keluhan_cache_staging (
                    scope_key, id_keluhan, id_sewa, judul_keluhan, deskripsi_keluhan,
                    foto_kerusakan, foto_kerusakan_url, status_keluhan, tanggal_lapor,
                    tanggal_selesai, nama_penghuni, email_penghuni, nomor_kamar
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                scope,
                item.id_keluhan,
                item.id_sewa,
                item.judul_keluhan,
                item.deskripsi_keluhan,
                item.foto_kerusakan ?? null,
                item.foto_kerusakan_url ?? null,
                item.status_keluhan,
                item.tanggal_lapor,
                item.tanggal_selesai ?? null,
                item.nama_penghuni,
                item.email_penghuni,
                item.nomor_kamar,
            );
        }
    });
}

export async function getPenyewaKeluhanStagingCount(
    db: SQLiteDatabase,
    scope: string,
): Promise<number> {
    return (
        (
            await db.getFirstAsync<CountRow>(
                "SELECT COUNT(*) AS count FROM penyewa_keluhan_cache_staging WHERE scope_key = ?",
                scope,
            )
        )?.count ?? 0
    );
}

export async function publishPenyewaKeluhanStaging(
    db: SQLiteDatabase,
    scope: string,
    expectedCount: number,
    syncedAt: string,
): Promise<void> {
    await db.withExclusiveTransactionAsync(async (txn) => {
        const count =
            (
                await txn.getFirstAsync<CountRow>(
                    "SELECT COUNT(*) AS count FROM penyewa_keluhan_cache_staging WHERE scope_key = ?",
                    scope,
                )
            )?.count ?? 0;
        if (count !== expectedCount)
            throw new Error("Jumlah staging KELUHAN penyewa berubah sebelum publikasi.");
        await txn.runAsync(
            "DELETE FROM penyewa_keluhan_cache WHERE scope_key = ?",
            scope,
        );
        await txn.runAsync(
            `INSERT INTO penyewa_keluhan_cache (
                scope_key, id_keluhan, id_sewa, judul_keluhan, deskripsi_keluhan,
                foto_kerusakan, foto_kerusakan_url, status_keluhan, tanggal_lapor,
                tanggal_selesai, nama_penghuni, email_penghuni, nomor_kamar
            )
            SELECT
                scope_key, id_keluhan, id_sewa, judul_keluhan, deskripsi_keluhan,
                foto_kerusakan, foto_kerusakan_url, status_keluhan, tanggal_lapor,
                tanggal_selesai, nama_penghuni, email_penghuni, nomor_kamar
            FROM penyewa_keluhan_cache_staging
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
            "DELETE FROM penyewa_keluhan_cache_staging WHERE scope_key = ?",
            scope,
        );
    });
}
