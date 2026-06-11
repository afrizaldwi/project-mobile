import type { LaporanKeuanganResponse } from "@/api/laporanService";
import type { SQLiteDatabase } from "expo-sqlite";

export const LAPORAN_ADMIN_SCOPE = "admin";

type PayloadRow = { payload_json: string };
type MetadataRow = { last_synced_at: string; is_dirty: number };
type UnknownRecord = Record<string, unknown>;

const object = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;
const nullableText = (value: unknown): value is string | null =>
    value === null || typeof value === "string";
const positiveInteger = (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value > 0;
const validDate = (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/.exec(value);
    if (!match || !Number.isFinite(Date.parse(value))) return false;
    const date = new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
    return (
        date.getUTCFullYear() === Number(match[1]) &&
        date.getUTCMonth() === Number(match[2]) - 1 &&
        date.getUTCDate() === Number(match[3])
    );
};

export function validateLaporanPeriod(bulan: number, tahun: number): void {
    if (
        !Number.isInteger(bulan) ||
        bulan < 1 ||
        bulan > 12 ||
        !Number.isInteger(tahun) ||
        tahun < 2000 ||
        tahun > 2100
    )
        throw new Error("Periode laporan keuangan tidak valid.");
}

export function laporanResourceKey(bulan: number, tahun: number): string {
    validateLaporanPeriod(bulan, tahun);
    return `laporan:${LAPORAN_ADMIN_SCOPE}:${tahun}-${String(bulan).padStart(2, "0")}`;
}

const numeric = (value: unknown, field: string): number => {
    if (
        typeof value === "number" &&
        Number.isFinite(value)
    )
        return value;
    if (
        typeof value === "string" &&
        value.trim() !== "" &&
        Number.isFinite(Number(value))
    )
        return Number(value);
    throw new Error(`${field} laporan keuangan tidak valid.`);
};

export function normalizeLaporanKeuangan(
    value: unknown,
    requestedBulan: number,
    requestedTahun: number,
): LaporanKeuanganResponse {
    validateLaporanPeriod(requestedBulan, requestedTahun);
    if (
        !object(value) ||
        !object(value.periode) ||
        value.periode.bulan !== requestedBulan ||
        value.periode.tahun !== requestedTahun ||
        !object(value.summary) ||
        !Array.isArray(value.pembayaran_terbaru) ||
        !Array.isArray(value.pengeluaran_terbaru)
    )
        throw new Error("Snapshot laporan keuangan tidak valid.");

    const pembayaranIds = new Set<number>();
    const pembayaran = value.pembayaran_terbaru.map((item) => {
        if (
            !object(item) ||
            !positiveInteger(item.id_pembayaran) ||
            pembayaranIds.has(item.id_pembayaran) ||
            !nullableText(item.nama_lengkap) ||
            !nullableText(item.kode_invoice) ||
            !validDate(item.tanggal_bayar) ||
            !nonEmpty(item.metode_pembayaran) ||
            !nonEmpty(item.status_verifikasi)
        )
            throw new Error("Pembayaran laporan keuangan tidak valid.");
        pembayaranIds.add(item.id_pembayaran);
        return {
            id_pembayaran: item.id_pembayaran,
            nama_lengkap: item.nama_lengkap,
            kode_invoice: item.kode_invoice,
            tanggal_bayar: item.tanggal_bayar,
            jumlah_bayar: numeric(item.jumlah_bayar, "Jumlah pembayaran"),
            metode_pembayaran: item.metode_pembayaran,
            status_verifikasi: item.status_verifikasi,
        };
    });

    const pengeluaranIds = new Set<number>();
    const pengeluaran = value.pengeluaran_terbaru.map((item) => {
        if (
            !object(item) ||
            !positiveInteger(item.id_pengeluaran) ||
            pengeluaranIds.has(item.id_pengeluaran) ||
            !nonEmpty(item.judul_pengeluaran) ||
            !nullableText(item.deskripsi) ||
            !validDate(item.tanggal_pengeluaran) ||
            !(
                item.pencatat === undefined ||
                item.pencatat === null ||
                (object(item.pencatat) &&
                    positiveInteger(item.pencatat.id) &&
                    nonEmpty(item.pencatat.nama_lengkap))
            )
        )
            throw new Error("Pengeluaran laporan keuangan tidak valid.");
        pengeluaranIds.add(item.id_pengeluaran);
        return {
            id_pengeluaran: item.id_pengeluaran,
            judul_pengeluaran: item.judul_pengeluaran,
            deskripsi: item.deskripsi,
            jumlah_pengeluaran: numeric(
                item.jumlah_pengeluaran,
                "Jumlah pengeluaran",
            ),
            tanggal_pengeluaran: item.tanggal_pengeluaran,
            pencatat:
                item.pencatat && object(item.pencatat)
                    ? {
                          id: item.pencatat.id as number,
                          nama_lengkap: item.pencatat.nama_lengkap as string,
                      }
                    : null,
        };
    });

    return {
        periode: { bulan: requestedBulan, tahun: requestedTahun },
        summary: {
            total_pemasukan: numeric(value.summary.total_pemasukan, "Total pemasukan"),
            total_pengeluaran: numeric(value.summary.total_pengeluaran, "Total pengeluaran"),
            laba_bersih: numeric(value.summary.laba_bersih, "Laba bersih"),
            tagihan_belum_bayar: numeric(
                value.summary.tagihan_belum_bayar,
                "Tagihan belum bayar",
            ),
        },
        pembayaran_terbaru: pembayaran,
        pengeluaran_terbaru: pengeluaran,
    };
}

export async function readLaporanKeuanganSnapshot(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
): Promise<LaporanKeuanganResponse> {
    validateLaporanPeriod(bulan, tahun);
    const row = await db.getFirstAsync<PayloadRow>(
        "SELECT payload_json FROM laporan_keuangan_cache WHERE scope_key=? AND tahun=? AND bulan=?",
        LAPORAN_ADMIN_SCOPE,
        tahun,
        bulan,
    );
    if (!row) throw new Error("Snapshot laporan keuangan belum tersedia.");
    try {
        return normalizeLaporanKeuangan(JSON.parse(row.payload_json), bulan, tahun);
    } catch (error) {
        if (__DEV__)
            console.warn(
                `[LAPORAN CACHE] Invalid cached report. Period: ${tahun}-${String(bulan).padStart(2, "0")}`,
                error instanceof Error ? error.message : String(error),
            );
        throw new Error("Snapshot laporan keuangan lokal tidak valid.");
    }
}

export async function hasValidLaporanKeuanganSnapshot(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
): Promise<boolean> {
    try {
        await readLaporanKeuanganSnapshot(db, bulan, tahun);
        return true;
    } catch {
        return false;
    }
}

export async function getLaporanKeuanganMetadata(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
) {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at,is_dirty FROM sync_metadata WHERE resource_name=?",
        laporanResourceKey(bulan, tahun),
    );
    return {
        lastSyncedAt: row?.last_synced_at || null,
        isDirty: row?.is_dirty === 1,
    };
}

export async function markLaporanKeuanganDirty(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
) {
    await db.runAsync(
        "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,'',1) ON CONFLICT(resource_name) DO UPDATE SET is_dirty=1",
        laporanResourceKey(bulan, tahun),
    );
}

export async function clearLaporanKeuanganStaging(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
) {
    validateLaporanPeriod(bulan, tahun);
    await db.runAsync(
        "DELETE FROM laporan_keuangan_cache_staging WHERE scope_key=? AND tahun=? AND bulan=?",
        LAPORAN_ADMIN_SCOPE,
        tahun,
        bulan,
    );
}

export async function insertLaporanKeuanganStaging(
    db: SQLiteDatabase,
    report: LaporanKeuanganResponse,
) {
    const normalized = normalizeLaporanKeuangan(
        report,
        report.periode.bulan,
        report.periode.tahun,
    );
    await db.runAsync(
        "INSERT OR REPLACE INTO laporan_keuangan_cache_staging(scope_key,tahun,bulan,payload_json) VALUES(?,?,?,?)",
        LAPORAN_ADMIN_SCOPE,
        normalized.periode.tahun,
        normalized.periode.bulan,
        JSON.stringify(normalized),
    );
}

export async function publishLaporanKeuangan(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
) {
    validateLaporanPeriod(bulan, tahun);
    await db.withExclusiveTransactionAsync(async (txn) => {
        const staged = await txn.getFirstAsync<PayloadRow>(
            "SELECT payload_json FROM laporan_keuangan_cache_staging WHERE scope_key=? AND tahun=? AND bulan=?",
            LAPORAN_ADMIN_SCOPE,
            tahun,
            bulan,
        );
        if (!staged) throw new Error("Snapshot staging laporan keuangan tidak tersedia.");
        await txn.runAsync(
            "INSERT OR REPLACE INTO laporan_keuangan_cache(scope_key,tahun,bulan,payload_json) VALUES(?,?,?,?)",
            LAPORAN_ADMIN_SCOPE,
            tahun,
            bulan,
            staged.payload_json,
        );
        await txn.runAsync(
            "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,?,0) ON CONFLICT(resource_name) DO UPDATE SET last_synced_at=excluded.last_synced_at,is_dirty=0",
            laporanResourceKey(bulan, tahun),
            new Date().toISOString(),
        );
        await txn.runAsync(
            "DELETE FROM laporan_keuangan_cache_staging WHERE scope_key=? AND tahun=? AND bulan=?",
            LAPORAN_ADMIN_SCOPE,
            tahun,
            bulan,
        );
    });
}
