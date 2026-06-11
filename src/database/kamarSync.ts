import type { SQLiteDatabase } from "expo-sqlite";

import { getKamarSyncPage } from "@/api/kamarService";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import {
    clearKamarStaging,
    getKamarStagingCount,
    insertKamarStagingPage,
    publishKamarStaging,
} from "@/database/kamarRepository";
import type { PaginationMeta } from "@/types/pagination";

const SYNC_PAGE_SIZE = 50;
let activeSync: Promise<void> | null = null;

type ExpectedSnapshot = { total: number; lastPage: number };

function validateInteger(value: number): boolean {
    return Number.isFinite(value) && Number.isInteger(value);
}

function validatePage(requestedPage: number, meta: PaginationMeta, itemCount: number, expected: ExpectedSnapshot | null): ExpectedSnapshot {
    if (
        !validateInteger(meta.current_page) || !validateInteger(meta.per_page) ||
        !validateInteger(meta.total) || !validateInteger(meta.last_page) ||
        meta.current_page !== requestedPage || meta.per_page !== SYNC_PAGE_SIZE ||
        meta.total < 0 || meta.last_page < 1 || requestedPage > meta.last_page ||
        itemCount > meta.per_page || (requestedPage < meta.last_page && itemCount === 0) ||
        meta.last_page !== Math.max(1, Math.ceil(meta.total / meta.per_page))
    ) {
        throw new Error("Respons sinkronisasi kamar memiliki pagination yang tidak valid.");
    }

    if (expected && (meta.total !== expected.total || meta.last_page !== expected.lastPage)) {
        throw new Error("Dataset kamar berubah selama sinkronisasi. Cache lama tetap digunakan.");
    }
    return expected ?? { total: meta.total, lastPage: meta.last_page };
}

async function runKamarSync(db: SQLiteDatabase): Promise<void> {
    let page = 1;
    let expected: ExpectedSnapshot | null = null;
    const seenIds = new Set<number>();
    const items: Awaited<ReturnType<typeof getKamarSyncPage>>["data"] = [];

    try {
        do {
            const response = await getKamarSyncPage({ page, per_page: SYNC_PAGE_SIZE, status: "semua" });
            expected = validatePage(page, response.meta, response.data.length, expected);
            for (const item of response.data) {
                if (seenIds.has(item.id_kamar)) {
                    throw new Error(`Sinkronisasi kamar berisi ID duplikat: .`);
                }
                seenIds.add(item.id_kamar);
            }
            items.push(...response.data);
            page += 1;
        } while (expected && page <= expected.lastPage);

        if (!expected || page - 1 !== expected.lastPage) {
            throw new Error("Sinkronisasi kamar tidak mencapai halaman terakhir yang diharapkan.");
        }
        const snapshot = expected;
        await withDatabaseSyncLock("kamar", async () => {
            await clearKamarStaging(db);
            await insertKamarStagingPage(db, items);
            const stagedCount = await getKamarStagingCount(db);
            if (stagedCount !== snapshot.total) {
                throw new Error(`Jumlah kamar hasil sinkronisasi tidak lengkap: ${stagedCount}/${snapshot.total}.`);
            }
            await publishKamarStaging(db, new Date().toISOString());
        });
    } catch (error) {
        await withDatabaseSyncLock("kamar:failure", async () => {
            await clearKamarStaging(db).catch(() => undefined);
        }).catch(() => undefined);
        throw error;
    }
}

export function synchronizeKamarCache(db: SQLiteDatabase): Promise<void> {
    if (activeSync) return activeSync;
    activeSync = runKamarSync(db).finally(() => { activeSync = null; });
    return activeSync;
}
