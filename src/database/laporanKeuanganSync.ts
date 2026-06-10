import { laporanService } from "@/api/laporanService";
import {
    clearLaporanKeuanganStaging,
    insertLaporanKeuanganStaging,
    laporanResourceKey,
    markLaporanKeuanganDirty,
    normalizeLaporanKeuangan,
    publishLaporanKeuangan,
    validateLaporanPeriod,
} from "@/database/laporanKeuanganRepository";
import type { SQLiteDatabase } from "expo-sqlite";

const active = new Map<string, Promise<void>>();

async function synchronize(db: SQLiteDatabase, bulan: number, tahun: number) {
    validateLaporanPeriod(bulan, tahun);
    try {
        await clearLaporanKeuanganStaging(db, bulan, tahun);
        const report = normalizeLaporanKeuangan(
            await laporanService.getLaporanKeuangan(bulan, tahun),
            bulan,
            tahun,
        );
        await insertLaporanKeuanganStaging(db, report);
        await publishLaporanKeuangan(db, bulan, tahun);
    } catch (error) {
        await clearLaporanKeuanganStaging(db, bulan, tahun).catch(() => undefined);
        await markLaporanKeuanganDirty(db, bulan, tahun).catch(() => undefined);
        if (__DEV__)
            console.error(
                `[LAPORAN SYNC] Synchronization failed. Period: ${tahun}-${String(bulan).padStart(2, "0")}`,
                error,
            );
        throw error;
    }
}

export function syncLaporanKeuangan(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
    force = false,
): Promise<void> {
    const key = laporanResourceKey(bulan, tahun);
    const current = active.get(key);
    if (current)
        return force
            ? current
                  .catch(() => undefined)
                  .then(() => syncLaporanKeuangan(db, bulan, tahun))
            : current;
    const promise = synchronize(db, bulan, tahun).finally(() => active.delete(key));
    active.set(key, promise);
    return promise;
}
