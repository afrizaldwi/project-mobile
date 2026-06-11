import type { SQLiteDatabase } from "expo-sqlite";

import { keluhanService } from "@/api/keluhanService";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import { clearKeluhanStaging, getKeluhanStagingCount, insertKeluhanStagingPage, markKeluhanCacheDirty, publishKeluhanStaging } from "@/database/keluhanRepository";
import type { Keluhan } from "@/types";
import type { AdminKeluhanSummary } from "@/types/keluhan";
import type { PaginationMeta } from "@/types/pagination";

const SYNC_PAGE_SIZE = 50;
let activeSync: Promise<void> | null = null;
type ExpectedSnapshot = { total: number; lastPage: number; perPage: number };
function isInteger(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value); }
function isNullableString(value: unknown): boolean { return value === null || typeof value === "string"; }
function validateItem(item: Keluhan): void {
    if (!item || typeof item !== "object" || !isInteger(item.id_keluhan) || item.id_keluhan < 1 || !isInteger(item.id_sewa) || item.id_sewa < 1 || typeof item.judul_keluhan !== "string" || typeof item.deskripsi_keluhan !== "string" || !isNullableString(item.foto_kerusakan) || !isNullableString(item.foto_kerusakan_url) || !["pending", "proses", "selesai"].includes(item.status_keluhan) || typeof item.tanggal_lapor !== "string" || item.tanggal_lapor.length === 0 || !isNullableString(item.tanggal_selesai) || typeof item.nama_penghuni !== "string" || typeof item.email_penghuni !== "string" || typeof item.nomor_kamar !== "string") throw new Error("Respons sinkronisasi KELUHAN memiliki item yang tidak valid.");
}
function validateSummary(summary: AdminKeluhanSummary): void {
    if (!summary || !isInteger(summary.total) || summary.total < 0 || !isInteger(summary.pending) || summary.pending < 0 || !isInteger(summary.proses) || summary.proses < 0 || !isInteger(summary.selesai) || summary.selesai < 0) throw new Error("Respons sinkronisasi KELUHAN memiliki summary yang tidak valid.");
}
function validatePage(page: number, meta: PaginationMeta, itemCount: number, expected: ExpectedSnapshot | null): ExpectedSnapshot {
    const expectedFrom = itemCount > 0 ? (page - 1) * SYNC_PAGE_SIZE + 1 : null; const expectedTo = itemCount > 0 ? expectedFrom! + itemCount - 1 : null;
    if (!meta || !isInteger(meta.current_page) || meta.current_page !== page || !isInteger(meta.per_page) || meta.per_page !== SYNC_PAGE_SIZE || !isInteger(meta.total) || meta.total < 0 || !isInteger(meta.last_page) || meta.last_page < 1 || meta.last_page !== Math.max(1, Math.ceil(meta.total / meta.per_page)) || meta.from !== expectedFrom || meta.to !== expectedTo || page > meta.last_page || itemCount > meta.per_page || (page < meta.last_page && itemCount === 0)) throw new Error("Respons sinkronisasi KELUHAN memiliki pagination yang tidak valid.");
    if (expected && (meta.total !== expected.total || meta.last_page !== expected.lastPage || meta.per_page !== expected.perPage)) throw new Error("Dataset KELUHAN berubah selama sinkronisasi. Cache lama tetap digunakan.");
    return expected ?? { total: meta.total, lastPage: meta.last_page, perPage: meta.per_page };
}
async function runKeluhanSync(db: SQLiteDatabase): Promise<void> {
    let page = 1; let traversedCount = 0; let expected: ExpectedSnapshot | null = null; const seenIds = new Set<number>(); const items: Keluhan[] = [];
    try {
        do {
            const response = await keluhanService.getAdminKeluhans({ page, per_page: SYNC_PAGE_SIZE, status: "semua" });
            if (!response || !Array.isArray(response.data) || !response.summary) throw new Error("Respons sinkronisasi KELUHAN tidak valid.");
            validateSummary(response.summary); expected = validatePage(page, response.meta, response.data.length, expected);
            for (const item of response.data) { validateItem(item); if (seenIds.has(item.id_keluhan)) throw new Error(`Sinkronisasi KELUHAN berisi id_keluhan duplikat: ${item.id_keluhan}.`); seenIds.add(item.id_keluhan); }
            traversedCount += response.data.length; items.push(...response.data); page += 1;
        } while (expected && page <= expected.lastPage);
        if (!expected || page - 1 !== expected.lastPage || traversedCount !== expected.total || seenIds.size !== expected.total) throw new Error("Jumlah KELUHAN hasil sinkronisasi tidak sesuai metadata.");
        const snapshot = expected;
        await withDatabaseSyncLock("keluhan:admin", async () => {
            await clearKeluhanStaging(db);
            await insertKeluhanStagingPage(db, items);
            const stagedCount = await getKeluhanStagingCount(db); if (stagedCount !== snapshot.total) throw new Error(`Jumlah staging KELUHAN tidak lengkap: ${stagedCount}/${snapshot.total}.`);
            await publishKeluhanStaging(db, snapshot.total, new Date().toISOString());
        });
    } catch (error) { await withDatabaseSyncLock("keluhan:admin:failure", async () => { await clearKeluhanStaging(db).catch(() => undefined); await markKeluhanCacheDirty(db).catch(() => undefined); }).catch(() => undefined); throw error; }
}
export function synchronizeKeluhanCache(db: SQLiteDatabase, requireNewRun = false): Promise<void> {
    if (activeSync) {
        if (requireNewRun) return activeSync.catch(() => undefined).then(() => synchronizeKeluhanCache(db));
        return activeSync;
    }
    activeSync = runKeluhanSync(db).finally(() => { activeSync = null; });
    return activeSync;
}
