import type { SQLiteDatabase } from "expo-sqlite";

import { getAdminPenghuniPage } from "@/api/penghuniService";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import { clearPenghuniStaging, getPenghuniStagingCount, insertPenghuniStagingPage, markPenghuniCacheDirty, publishPenghuniStaging } from "@/database/penghuniRepository";
import type { PaginationMeta } from "@/types/pagination";
import type { AdminPenghuniItem, AdminPenghuniListResponse } from "@/types/penghuni";

const SYNC_PAGE_SIZE = 50;
let activeSync: Promise<void> | null = null;
type ExpectedSnapshot = { total: number; lastPage: number; perPage: number };
function isInteger(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value); }
function isNullableString(value: unknown): value is string | null { return value === null || typeof value === "string"; }
function validateRelation(value: unknown, idKey: "id" | "id_kamar", stringKeys: string[]): void {
    if (!value || typeof value !== "object") throw new Error("Respons sinkronisasi PENGHUNI memiliki relasi yang tidak valid.");
    const relation = value as Record<string, unknown>;
    if (!(relation[idKey] === null || isInteger(relation[idKey]))) throw new Error("Respons sinkronisasi PENGHUNI memiliki ID relasi yang tidak valid.");
    for (const key of stringKeys) if (!isNullableString(relation[key])) throw new Error(`Respons sinkronisasi PENGHUNI memiliki field ${key} yang tidak valid.`);
}
function validateItem(item: AdminPenghuniItem): void {
    if (!item || typeof item !== "object" || !isInteger(item.id_sewa) || item.id_sewa < 1 || typeof item.tanggal_masuk !== "string" || !isNullableString(item.tanggal_keluar) || typeof item.harga_deal !== "string" || !isInteger(item.durasi_sewa_bulan) || item.durasi_sewa_bulan < 1 || !["aktif", "selesai", "dibatalkan"].includes(item.status_sewa)) throw new Error("Respons sinkronisasi PENGHUNI memiliki item wajib yang tidak valid.");
    validateRelation(item.user, "id", ["nama_lengkap", "email", "no_hp", "alamat_asal", "foto_profil"]);
    validateRelation(item.kamar, "id_kamar", ["nomor_kamar", "fasilitas", "harga_bulanan", "luas_kamar", "foto_kamar", "status_kamar"]);
}
function validatePage(page: number, meta: PaginationMeta, itemCount: number, expected: ExpectedSnapshot | null): ExpectedSnapshot {
    const expectedFrom = itemCount > 0 ? (page - 1) * SYNC_PAGE_SIZE + 1 : null;
    const expectedTo = itemCount > 0 ? expectedFrom! + itemCount - 1 : null;
    if (!meta || !isInteger(meta.current_page) || meta.current_page !== page || !isInteger(meta.per_page) || meta.per_page !== SYNC_PAGE_SIZE || !isInteger(meta.total) || meta.total < 0 || !isInteger(meta.last_page) || meta.last_page < 1 || meta.last_page !== Math.max(1, Math.ceil(meta.total / meta.per_page)) || meta.from !== expectedFrom || meta.to !== expectedTo || page > meta.last_page || itemCount > meta.per_page || (page < meta.last_page && itemCount === 0)) throw new Error("Respons sinkronisasi PENGHUNI memiliki pagination yang tidak valid.");
    if (expected && (meta.total !== expected.total || meta.last_page !== expected.lastPage || meta.per_page !== expected.perPage)) throw new Error("Dataset PENGHUNI berubah selama sinkronisasi. Cache lama tetap digunakan.");
    return expected ?? { total: meta.total, lastPage: meta.last_page, perPage: meta.per_page };
}
async function fetchPenghuniPage(page: number): Promise<{ response: AdminPenghuniListResponse; page: number }> {
    const response = await getAdminPenghuniPage({ page, per_page: SYNC_PAGE_SIZE, status: "all" });
    if (!response || !Array.isArray(response.data)) throw new Error("Respons sinkronisasi PENGHUNI tidak valid.");
    return { response, page };
}

async function runPenghuniSync(db: SQLiteDatabase): Promise<void> {
    const seenIds = new Set<number>(); const items: AdminPenghuniItem[] = [];
    try {
        const first = await fetchPenghuniPage(1);
        const expected = validatePage(1, first.response.meta, first.response.data.length, null);
        for (const item of first.response.data) { validateItem(item); if (seenIds.has(item.id_sewa)) throw new Error(`Sinkronisasi PENGHUNI berisi id_sewa duplikat: ${item.id_sewa}.`); seenIds.add(item.id_sewa); }
        items.push(...first.response.data);

        if (expected.lastPage > 1) {
            const pageNumbers = [];
            for (let p = 2; p <= expected.lastPage; p++) pageNumbers.push(p);
            const pages = await Promise.all(pageNumbers.map((p) => fetchPenghuniPage(p)));
            for (const { response, page } of pages) {
                validatePage(page, response.meta, response.data.length, expected);
                for (const item of response.data) { validateItem(item); if (seenIds.has(item.id_sewa)) throw new Error(`Sinkronisasi PENGHUNI berisi id_sewa duplikat: ${item.id_sewa}.`); seenIds.add(item.id_sewa); }
                items.push(...response.data);
            }
        }

        if (seenIds.size !== expected.total) throw new Error("Jumlah PENGHUNI hasil sinkronisasi tidak sesuai metadata.");
        await withDatabaseSyncLock("penghuni", async () => {
            await clearPenghuniStaging(db);
            await insertPenghuniStagingPage(db, items);
            const stagedCount = await getPenghuniStagingCount(db);
            if (stagedCount !== expected.total) throw new Error(`Jumlah staging PENGHUNI tidak lengkap: ${stagedCount}/${expected.total}.`);
            await publishPenghuniStaging(db, expected.total, new Date().toISOString());
        });
    } catch (error) {
        await withDatabaseSyncLock("penghuni:failure", async () => {
            await clearPenghuniStaging(db).catch(() => undefined);
            await markPenghuniCacheDirty(db).catch(() => undefined);
        }).catch(() => undefined);
        throw error;
    }
}
export function synchronizePenghuniCache(db: SQLiteDatabase): Promise<void> {
    if (activeSync) return activeSync;
    activeSync = runPenghuniSync(db).finally(() => { activeSync = null; });
    return activeSync;
}
