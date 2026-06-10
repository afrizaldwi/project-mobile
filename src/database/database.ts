import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 6;
type TableInfoRow = { name: string };
type IndexListRow = { name: string };

const PENGHUNI_COLUMNS = [
    "id_sewa",
    "tanggal_masuk",
    "tanggal_keluar",
    "harga_deal",
    "durasi_sewa_bulan",
    "status_sewa",
    "user_id",
    "user_nama_lengkap",
    "user_email",
    "user_no_hp",
    "user_alamat_asal",
    "user_foto_profil",
    "kamar_id",
    "kamar_nomor_kamar",
    "kamar_fasilitas",
    "kamar_harga_bulanan",
    "kamar_luas_kamar",
    "kamar_foto_kamar",
    "kamar_status_kamar",
];
const KELUHAN_COLUMNS = [
    "id_keluhan",
    "id_sewa",
    "judul_keluhan",
    "deskripsi_keluhan",
    "foto_kerusakan",
    "foto_kerusakan_url",
    "status_keluhan",
    "tanggal_lapor",
    "tanggal_selesai",
    "nama_penghuni",
    "email_penghuni",
    "nomor_kamar",
];
const TAGIHAN_COLUMNS = [
    "scope_key",
    "id_tagihan",
    "status_tagihan",
    "tanggal_jatuh_tempo",
    "kode_invoice",
    "penyewa_nama",
    "penyewa_email",
    "penyewa_no_hp",
    "nomor_kamar",
    "payload_json",
];
const PENDING_COLUMNS = [
    "scope_key",
    "id_pembayaran",
    "tanggal_bayar",
    "metode_pembayaran",
    "kode_invoice",
    "penyewa_nama",
    "penyewa_email",
    "penyewa_no_hp",
    "nomor_kamar",
    "payload_json",
];

async function validateTagihanSchema(db: SQLiteDatabase): Promise<void> {
    for (const [table, required] of [
        ["tagihan_cache", TAGIHAN_COLUMNS],
        ["tagihan_cache_staging", TAGIHAN_COLUMNS],
        ["pending_pembayaran_cache", PENDING_COLUMNS],
        ["pending_pembayaran_cache_staging", PENDING_COLUMNS],
    ] as const) {
        const names = new Set(
            (await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table})`)).map(
                (column) => column.name,
            ),
        );
        if (required.some((column) => !names.has(column)))
            throw new Error(`Migrasi database gagal memvalidasi tabel ${table}.`);
    }
    for (const [table, required] of [
        [
            "tagihan_cache",
            [
                "idx_tagihan_scope_order",
                "idx_tagihan_scope_status",
                "idx_tagihan_scope_invoice",
                "idx_tagihan_scope_tenant",
                "idx_tagihan_scope_room",
            ],
        ],
        [
            "pending_pembayaran_cache",
            [
                "idx_pending_scope_order",
                "idx_pending_scope_invoice",
                "idx_pending_scope_tenant",
                "idx_pending_scope_room",
            ],
        ],
    ] as const) {
        const names = new Set(
            (await db.getAllAsync<IndexListRow>(`PRAGMA index_list(${table})`)).map(
                (index) => index.name,
            ),
        );
        if (required.some((index) => !names.has(index)))
            throw new Error(`Migrasi database gagal memvalidasi index ${table}.`);
    }
}

async function validatePenghuniSchema(db: SQLiteDatabase): Promise<void> {
    for (const table of ["penghuni_cache", "penghuni_cache_staging"]) {
        const columns = await db.getAllAsync<TableInfoRow>(
            `PRAGMA table_info(${table})`,
        );
        const names = new Set(columns.map((column) => column.name));
        if (PENGHUNI_COLUMNS.some((column) => !names.has(column))) {
            throw new Error(`Migrasi database gagal memvalidasi tabel ${table}.`);
        }
    }
    const indexes = await db.getAllAsync<IndexListRow>(
        "PRAGMA index_list(penghuni_cache)",
    );
    const names = new Set(indexes.map((index) => index.name));
    for (const index of [
        "idx_penghuni_cache_status",
        "idx_penghuni_cache_order",
        "idx_penghuni_cache_nama",
        "idx_penghuni_cache_email",
        "idx_penghuni_cache_phone",
        "idx_penghuni_cache_room",
        "idx_penghuni_cache_user",
        "idx_penghuni_cache_kamar",
    ]) {
        if (!names.has(index))
            throw new Error(`Migrasi database gagal memvalidasi index ${index}.`);
    }
}

async function validateKeluhanSchema(db: SQLiteDatabase): Promise<void> {
    for (const table of ["keluhan_cache", "keluhan_cache_staging"]) {
        const columns = await db.getAllAsync<TableInfoRow>(
            `PRAGMA table_info(${table})`,
        );
        const names = new Set(columns.map((column) => column.name));
        if (KELUHAN_COLUMNS.some((column) => !names.has(column)))
            throw new Error(`Migrasi database gagal memvalidasi tabel ${table}.`);
    }
    const indexes = await db.getAllAsync<IndexListRow>(
        "PRAGMA index_list(keluhan_cache)",
    );
    const names = new Set(indexes.map((index) => index.name));
    for (const index of [
        "idx_keluhan_cache_status",
        "idx_keluhan_cache_order",
        "idx_keluhan_cache_status_order",
        "idx_keluhan_cache_sewa",
    ]) {
        if (!names.has(index))
            throw new Error(`Migrasi database gagal memvalidasi index ${index}.`);
    }
}

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
    await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    const versionRow = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
    );
    const currentVersion = versionRow?.user_version ?? 0;
    if (currentVersion >= DATABASE_VERSION) return;
    const metadataColumns = await db.getAllAsync<TableInfoRow>(
        "PRAGMA table_info(sync_metadata)",
    );
    const hasDirtyColumn = metadataColumns.some(
        (column) => column.name === "is_dirty",
    );

    await db.withExclusiveTransactionAsync(async (txn) => {
        if (currentVersion < 1) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS kamar_cache (
                    id_kamar INTEGER PRIMARY KEY NOT NULL, nomor_kamar TEXT NOT NULL, luas_kamar TEXT NOT NULL,
                    fasilitas TEXT NOT NULL, harga_bulanan TEXT NOT NULL,
                    status_kamar TEXT NOT NULL CHECK (status_kamar IN ('tersedia', 'terisi', 'perbaikan')),
                    foto_kamar TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sync_run_id TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_kamar_cache_status ON kamar_cache(status_kamar);
                CREATE INDEX IF NOT EXISTS idx_kamar_cache_nomor ON kamar_cache(nomor_kamar);
                CREATE INDEX IF NOT EXISTS idx_kamar_cache_order ON kamar_cache(nomor_kamar COLLATE NOCASE, id_kamar);
                CREATE TABLE IF NOT EXISTS sync_metadata (resource_name TEXT PRIMARY KEY NOT NULL, last_synced_at TEXT NOT NULL);
            `);
        }
        if (currentVersion < 2) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS kamar_cache_staging (
                    id_kamar INTEGER PRIMARY KEY NOT NULL, nomor_kamar TEXT NOT NULL, luas_kamar TEXT NOT NULL,
                    fasilitas TEXT NOT NULL, harga_bulanan TEXT NOT NULL,
                    status_kamar TEXT NOT NULL CHECK (status_kamar IN ('tersedia', 'terisi', 'perbaikan')),
                    foto_kamar TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
            `);
            if (!hasDirtyColumn)
                await txn.execAsync(
                    "ALTER TABLE sync_metadata ADD COLUMN is_dirty INTEGER NOT NULL DEFAULT 0;",
                );
        }
        if (currentVersion < 3) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS tamu_cache (
                    id_tamu INTEGER PRIMARY KEY NOT NULL, nama_tamu TEXT NOT NULL, no_hp_tamu TEXT NOT NULL,
                    keperluan TEXT NOT NULL, waktu_berkunjung TEXT NOT NULL, visit_date_jakarta TEXT NOT NULL,
                    id_user INTEGER NOT NULL, nama_penghuni TEXT NOT NULL, nomor_kamar TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tamu_cache_staging (
                    id_tamu INTEGER PRIMARY KEY NOT NULL, nama_tamu TEXT NOT NULL, no_hp_tamu TEXT NOT NULL,
                    keperluan TEXT NOT NULL, waktu_berkunjung TEXT NOT NULL, visit_date_jakarta TEXT NOT NULL,
                    id_user INTEGER NOT NULL, nama_penghuni TEXT NOT NULL, nomor_kamar TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_tamu_cache_visit_order ON tamu_cache(waktu_berkunjung DESC, id_tamu DESC);
            `);
        }
        if (currentVersion < 4) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS penghuni_cache (
                    id_sewa INTEGER PRIMARY KEY NOT NULL, tanggal_masuk TEXT NOT NULL, tanggal_keluar TEXT,
                    harga_deal TEXT NOT NULL, durasi_sewa_bulan INTEGER NOT NULL,
                    status_sewa TEXT NOT NULL CHECK(status_sewa IN ('aktif', 'selesai', 'dibatalkan')),
                    user_id INTEGER, user_nama_lengkap TEXT, user_email TEXT, user_no_hp TEXT,
                    user_alamat_asal TEXT, user_foto_profil TEXT, kamar_id INTEGER, kamar_nomor_kamar TEXT,
                    kamar_fasilitas TEXT, kamar_harga_bulanan TEXT, kamar_luas_kamar TEXT,
                    kamar_foto_kamar TEXT, kamar_status_kamar TEXT
                );
                CREATE TABLE IF NOT EXISTS penghuni_cache_staging (
                    id_sewa INTEGER PRIMARY KEY NOT NULL, tanggal_masuk TEXT NOT NULL, tanggal_keluar TEXT,
                    harga_deal TEXT NOT NULL, durasi_sewa_bulan INTEGER NOT NULL,
                    status_sewa TEXT NOT NULL CHECK(status_sewa IN ('aktif', 'selesai', 'dibatalkan')),
                    user_id INTEGER, user_nama_lengkap TEXT, user_email TEXT, user_no_hp TEXT,
                    user_alamat_asal TEXT, user_foto_profil TEXT, kamar_id INTEGER, kamar_nomor_kamar TEXT,
                    kamar_fasilitas TEXT, kamar_harga_bulanan TEXT, kamar_luas_kamar TEXT,
                    kamar_foto_kamar TEXT, kamar_status_kamar TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_status ON penghuni_cache(status_sewa);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_order ON penghuni_cache(tanggal_masuk DESC, id_sewa DESC);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_nama ON penghuni_cache(user_nama_lengkap COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_email ON penghuni_cache(user_email COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_phone ON penghuni_cache(user_no_hp COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_room ON penghuni_cache(kamar_nomor_kamar COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_user ON penghuni_cache(user_id);
                CREATE INDEX IF NOT EXISTS idx_penghuni_cache_kamar ON penghuni_cache(kamar_id);
            `);
            await validatePenghuniSchema(txn);
        }
        if (currentVersion < 5) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS keluhan_cache (
                    id_keluhan INTEGER PRIMARY KEY NOT NULL, id_sewa INTEGER NOT NULL, judul_keluhan TEXT NOT NULL,
                    deskripsi_keluhan TEXT NOT NULL, foto_kerusakan TEXT, foto_kerusakan_url TEXT,
                    status_keluhan TEXT NOT NULL CHECK(status_keluhan IN ('pending', 'proses', 'selesai')),
                    tanggal_lapor TEXT NOT NULL, tanggal_selesai TEXT, nama_penghuni TEXT NOT NULL,
                    email_penghuni TEXT NOT NULL, nomor_kamar TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS keluhan_cache_staging (
                    id_keluhan INTEGER PRIMARY KEY NOT NULL, id_sewa INTEGER NOT NULL, judul_keluhan TEXT NOT NULL,
                    deskripsi_keluhan TEXT NOT NULL, foto_kerusakan TEXT, foto_kerusakan_url TEXT,
                    status_keluhan TEXT NOT NULL CHECK(status_keluhan IN ('pending', 'proses', 'selesai')),
                    tanggal_lapor TEXT NOT NULL, tanggal_selesai TEXT, nama_penghuni TEXT NOT NULL,
                    email_penghuni TEXT NOT NULL, nomor_kamar TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_keluhan_cache_status ON keluhan_cache(status_keluhan);
                CREATE INDEX IF NOT EXISTS idx_keluhan_cache_order ON keluhan_cache(tanggal_lapor DESC, id_keluhan DESC);
                CREATE INDEX IF NOT EXISTS idx_keluhan_cache_status_order ON keluhan_cache(status_keluhan, tanggal_lapor DESC, id_keluhan DESC);
                CREATE INDEX IF NOT EXISTS idx_keluhan_cache_sewa ON keluhan_cache(id_sewa);
            `);
            await validateKeluhanSchema(txn);
        }
        if (currentVersion < 6) {
            await txn.execAsync(`
                CREATE TABLE IF NOT EXISTS tagihan_cache (scope_key TEXT NOT NULL, id_tagihan INTEGER NOT NULL, status_tagihan TEXT NOT NULL, tanggal_jatuh_tempo TEXT NOT NULL, kode_invoice TEXT NOT NULL, penyewa_nama TEXT, penyewa_email TEXT, penyewa_no_hp TEXT, nomor_kamar TEXT, payload_json TEXT NOT NULL, PRIMARY KEY(scope_key, id_tagihan));
                CREATE TABLE IF NOT EXISTS tagihan_cache_staging (scope_key TEXT NOT NULL, id_tagihan INTEGER NOT NULL, status_tagihan TEXT NOT NULL, tanggal_jatuh_tempo TEXT NOT NULL, kode_invoice TEXT NOT NULL, penyewa_nama TEXT, penyewa_email TEXT, penyewa_no_hp TEXT, nomor_kamar TEXT, payload_json TEXT NOT NULL, PRIMARY KEY(scope_key, id_tagihan));
                CREATE TABLE IF NOT EXISTS pending_pembayaran_cache (scope_key TEXT NOT NULL, id_pembayaran INTEGER NOT NULL, tanggal_bayar TEXT NOT NULL, metode_pembayaran TEXT NOT NULL, kode_invoice TEXT, penyewa_nama TEXT, penyewa_email TEXT, penyewa_no_hp TEXT, nomor_kamar TEXT, payload_json TEXT NOT NULL, PRIMARY KEY(scope_key, id_pembayaran));
                CREATE TABLE IF NOT EXISTS pending_pembayaran_cache_staging (scope_key TEXT NOT NULL, id_pembayaran INTEGER NOT NULL, tanggal_bayar TEXT NOT NULL, metode_pembayaran TEXT NOT NULL, kode_invoice TEXT, penyewa_nama TEXT, penyewa_email TEXT, penyewa_no_hp TEXT, nomor_kamar TEXT, payload_json TEXT NOT NULL, PRIMARY KEY(scope_key, id_pembayaran));
                CREATE INDEX IF NOT EXISTS idx_tagihan_scope_order ON tagihan_cache(scope_key, tanggal_jatuh_tempo DESC, id_tagihan DESC);
                CREATE INDEX IF NOT EXISTS idx_tagihan_scope_status ON tagihan_cache(scope_key, status_tagihan);
                CREATE INDEX IF NOT EXISTS idx_tagihan_scope_invoice ON tagihan_cache(scope_key, kode_invoice COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_tagihan_scope_tenant ON tagihan_cache(scope_key, penyewa_nama COLLATE NOCASE, penyewa_email COLLATE NOCASE, penyewa_no_hp COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_tagihan_scope_room ON tagihan_cache(scope_key, nomor_kamar COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_pending_scope_order ON pending_pembayaran_cache(scope_key, tanggal_bayar DESC, id_pembayaran DESC);
                CREATE INDEX IF NOT EXISTS idx_pending_scope_invoice ON pending_pembayaran_cache(scope_key, kode_invoice COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_pending_scope_tenant ON pending_pembayaran_cache(scope_key, penyewa_nama COLLATE NOCASE, penyewa_email COLLATE NOCASE, penyewa_no_hp COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_pending_scope_room ON pending_pembayaran_cache(scope_key, nomor_kamar COLLATE NOCASE);
            `);
            await validateTagihanSchema(txn);
        }
        await txn.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
    });
}

export const APP_DATABASE_NAME = "kost-bahagia.db";
