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
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import {
    getSafeErrorMessage,
    isRecoverableApiAvailabilityError,
} from "@/utils/apiErrors";
import type { SQLiteDatabase } from "expo-sqlite";

const active = new Map<string, Promise<void>>();

async function fetchAndValidateLaporanKeuangan(bulan: number, tahun: number) {
    validateLaporanPeriod(bulan, tahun);
    return normalizeLaporanKeuangan(
        await laporanService.getLaporanKeuangan(bulan, tahun),
        bulan,
        tahun,
    );
}

async function persistLaporanKeuangan(
    db: SQLiteDatabase,
    bulan: number,
    tahun: number,
    report: ReturnType<typeof normalizeLaporanKeuangan>,
) {
    await clearLaporanKeuanganStaging(db, bulan, tahun);
    await insertLaporanKeuanganStaging(db, report);
    await publishLaporanKeuangan(db, bulan, tahun);
}

async function synchronize(db: SQLiteDatabase, bulan: number, tahun: number) {
    validateLaporanPeriod(bulan, tahun);
    try {
        const report = await fetchAndValidateLaporanKeuangan(bulan, tahun);
        await withDatabaseSyncLock(laporanResourceKey(bulan, tahun), () =>
            persistLaporanKeuangan(db, bulan, tahun, report),
        );
    } catch (error) {
        await withDatabaseSyncLock(
            `${laporanResourceKey(bulan, tahun)}:failure`,
            async () => {
                await clearLaporanKeuanganStaging(db, bulan, tahun).catch(() => undefined);
                await markLaporanKeuanganDirty(db, bulan, tahun).catch(() => undefined);
            },
        ).catch(() => undefined);
        if (__DEV__) {
            const details = {
                period: `${tahun}-${String(bulan).padStart(2, "0")}`,
                message: getSafeErrorMessage(error),
            };
            if (isRecoverableApiAvailabilityError(error)) {
                console.warn("[LAPORAN SYNC] Synchronization unavailable", details);
            } else {
                console.error("[LAPORAN SYNC] Synchronization failed", details);
            }
        }
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
