import type { SQLiteDatabase } from "expo-sqlite";

import { tamuService } from "@/api/tamuService";
import { clearTamuStaging, getTamuStagingCount, insertTamuStagingPage, markTamuCacheDirty, publishTamuStaging } from "@/database/tamuRepository";
import type { PaginationMeta } from "@/types/pagination";
import type { AdminTamuItem } from "@/types/tamu";

const SYNC_PAGE_SIZE = 50;
let activeSync: Promise<void> | null = null;
type ExpectedSnapshot = { total: number; lastPage: number; perPage: number };

function isInteger(value: number): boolean {
    return Number.isFinite(value) && Number.isInteger(value);
}

function jakartaDateFromParts(parts: Intl.DateTimeFormatPart[]): string {
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    const value = `${get("year")}-${get("month")}-${get("day")}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Tanggal Asia/Jakarta tidak valid.");
    return value;
}

export function getJakartaToday(now = new Date()): string {
    return jakartaDateFromParts(new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now));
}

export function normalizeVisitDateJakarta(value: string): string {
    const localMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T]|$)/);
    const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    if (localMatch && !hasExplicitTimezone) {
        const [, year, month, day] = localMatch;
        const probe = new Date(`${year}-${month}-${day}T00:00:00Z`);
        if (probe.getUTCFullYear() !== Number(year) || probe.getUTCMonth() + 1 !== Number(month) || probe.getUTCDate() !== Number(day)) {
            throw new Error(`Timestamp TAMU tidak valid: ${value}`);
        }
        return `${year}-${month}-${day}`;
    }
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) throw new Error(`Timestamp TAMU tidak valid: ${value}`);
    return jakartaDateFromParts(new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(parsed));
}

function validateItem(item: AdminTamuItem): void {
    if (!isInteger(item.id_tamu) || item.id_tamu < 1 || !isInteger(item.id_user) || item.id_user < 1) {
        throw new Error("Respons sinkronisasi TAMU memiliki ID yang tidak valid.");
    }
    for (const value of [item.nama_tamu, item.no_hp_tamu, item.keperluan, item.waktu_berkunjung, item.nama_penghuni, item.nomor_kamar]) {
        if (typeof value !== "string") throw new Error("Respons sinkronisasi TAMU memiliki field wajib yang tidak valid.");
    }
}

function validatePage(requestedPage: number, meta: PaginationMeta, itemCount: number, expected: ExpectedSnapshot | null): ExpectedSnapshot {
    if (
        !isInteger(requestedPage) || requestedPage < 1 || !isInteger(meta.current_page) || meta.current_page !== requestedPage ||
        !isInteger(meta.per_page) || meta.per_page !== SYNC_PAGE_SIZE || !isInteger(meta.total) || meta.total < 0 ||
        !isInteger(meta.last_page) || meta.last_page < 1 || meta.last_page !== Math.max(1, Math.ceil(meta.total / meta.per_page)) ||
        requestedPage > meta.last_page || itemCount > meta.per_page || (requestedPage < meta.last_page && itemCount === 0)
    ) throw new Error("Respons sinkronisasi TAMU memiliki pagination yang tidak valid.");
    if (expected && (meta.total !== expected.total || meta.last_page !== expected.lastPage || meta.per_page !== expected.perPage)) {
        throw new Error("Dataset TAMU berubah selama sinkronisasi. Cache lama tetap digunakan.");
    }
    return expected ?? { total: meta.total, lastPage: meta.last_page, perPage: meta.per_page };
}

async function runTamuSync(db: SQLiteDatabase): Promise<void> {
    await clearTamuStaging(db);
    let page = 1;
    let expected: ExpectedSnapshot | null = null;
    const seenIds = new Set<number>();
    try {
        do {
            const response = await tamuService.getAdminTamus({ page, per_page: SYNC_PAGE_SIZE });
            expected = validatePage(page, response.meta, response.data.length, expected);
            const stagingItems = response.data.map((item) => {
                validateItem(item);
                if (seenIds.has(item.id_tamu)) throw new Error(`Sinkronisasi TAMU berisi ID duplikat: ${item.id_tamu}.`);
                seenIds.add(item.id_tamu);
                return { ...item, visit_date_jakarta: normalizeVisitDateJakarta(item.waktu_berkunjung) };
            });
            await insertTamuStagingPage(db, stagingItems);
            page += 1;
        } while (expected && page <= expected.lastPage);

        if (!expected || page - 1 !== expected.lastPage || seenIds.size !== expected.total) {
            throw new Error("Jumlah TAMU hasil sinkronisasi tidak sesuai metadata.");
        }
        const stagedCount = await getTamuStagingCount(db);
        if (stagedCount !== expected.total) throw new Error(`Jumlah staging TAMU tidak lengkap: ${stagedCount}/${expected.total}.`);
        await publishTamuStaging(db, expected.total, new Date().toISOString());
    } catch (error) {
        await clearTamuStaging(db).catch(() => undefined);
        await markTamuCacheDirty(db).catch(() => undefined);
        throw error;
    }
}

export function synchronizeTamuCache(db: SQLiteDatabase): Promise<void> {
    if (activeSync) return activeSync;
    activeSync = runTamuSync(db).finally(() => { activeSync = null; });
    return activeSync;
}
