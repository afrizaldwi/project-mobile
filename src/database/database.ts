import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 2;
type TableInfoRow = { name: string };

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
    await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

    const versionRow = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    const currentVersion = versionRow?.user_version ?? 0;
    if (currentVersion >= DATABASE_VERSION) return;

    const metadataColumns = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(sync_metadata)");
    const hasDirtyColumn = metadataColumns.some((column) => column.name === "is_dirty");

    await db.withExclusiveTransactionAsync(async (txn) => {
        if (currentVersion < 1) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS kamar_cache (
                    id_kamar INTEGER PRIMARY KEY NOT NULL,
                    nomor_kamar TEXT NOT NULL,
                    luas_kamar TEXT NOT NULL,
                    fasilitas TEXT NOT NULL,
                    harga_bulanan TEXT NOT NULL,
                    status_kamar TEXT NOT NULL CHECK (status_kamar IN ('tersedia', 'terisi', 'perbaikan')),
                    foto_kamar TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    sync_run_id TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_kamar_cache_status ON kamar_cache(status_kamar);
                CREATE INDEX IF NOT EXISTS idx_kamar_cache_nomor ON kamar_cache(nomor_kamar);
                CREATE INDEX IF NOT EXISTS idx_kamar_cache_order ON kamar_cache(nomor_kamar COLLATE NOCASE, id_kamar);
                CREATE TABLE IF NOT EXISTS sync_metadata (
                    resource_name TEXT PRIMARY KEY NOT NULL,
                    last_synced_at TEXT NOT NULL
                );
            `);
        }

        if (currentVersion < 2) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS kamar_cache_staging (
                    id_kamar INTEGER PRIMARY KEY NOT NULL,
                    nomor_kamar TEXT NOT NULL,
                    luas_kamar TEXT NOT NULL,
                    fasilitas TEXT NOT NULL,
                    harga_bulanan TEXT NOT NULL,
                    status_kamar TEXT NOT NULL CHECK (status_kamar IN ('tersedia', 'terisi', 'perbaikan')),
                    foto_kamar TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            `);
            if (!hasDirtyColumn) {
                await txn.execAsync("ALTER TABLE sync_metadata ADD COLUMN is_dirty INTEGER NOT NULL DEFAULT 0;");
            }
        }

        await txn.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
}

export const APP_DATABASE_NAME = "kost-bahagia.db";
