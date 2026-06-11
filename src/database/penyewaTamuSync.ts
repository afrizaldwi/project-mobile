import type { SQLiteDatabase } from "expo-sqlite";

import { tamuService } from "@/api/tamuService";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import {
    clearPenyewaTamuStaging,
    getPenyewaTamuStagingCount,
    insertPenyewaTamuStaging,
    markPenyewaTamuDirty,
    publishPenyewaTamuStaging,
} from "@/database/penyewaTamuRepository";
import type { Tamu } from "@/types";
import {
    getSafeErrorMessage,
    isRecoverableApiAvailabilityError,
} from "@/utils/apiErrors";

const activeSyncs = new Map<string, Promise<void>>();

function getScopeUserId(scope: string): number {
    const match = scope.match(/^penyewa:(\d+)$/);
    const userId = match ? Number(match[1]) : Number.NaN;
    if (!Number.isInteger(userId) || userId < 1)
        throw new Error("Scope TAMU penyewa tidak valid.");
    return userId;
}

function validateTamu(item: Tamu, expectedUserId: number): void {
    if (!Number.isInteger(item.id_tamu) || item.id_tamu < 1)
        throw new Error("ID TAMU penyewa tidak valid.");
    if (!Number.isInteger(item.id_user) || item.id_user !== expectedUserId)
        throw new Error("Scope TAMU penyewa tidak sesuai dengan pengguna aktif.");
    for (const value of [
        item.nama_tamu,
        item.no_hp_tamu,
        item.keperluan,
        item.waktu_berkunjung,
        item.nama_penghuni,
        item.nomor_kamar,
    ]) {
        if (typeof value !== "string" || !value.trim())
            throw new Error("Field TAMU penyewa wajib tidak valid.");
    }
    if (!Number.isFinite(new Date(item.waktu_berkunjung).getTime()))
        throw new Error("Tanggal kunjungan TAMU penyewa tidak valid.");
}

async function runPenyewaTamuSync(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    const expectedUserId = getScopeUserId(scope);
    try {
        const response = await tamuService.getPenyewaTamus();
        if (!Array.isArray(response))
            throw new Error("Respons TAMU penyewa harus berupa array.");
        const seenIds = new Set<number>();
        for (const item of response) {
            validateTamu(item, expectedUserId);
            if (seenIds.has(item.id_tamu))
                throw new Error(`Sinkronisasi TAMU penyewa berisi ID duplikat: ${item.id_tamu}.`);
            seenIds.add(item.id_tamu);
        }
        await withDatabaseSyncLock(`tamu:${scope}`, async () => {
            await clearPenyewaTamuStaging(db, scope);
            await insertPenyewaTamuStaging(db, scope, response);
            const stagedCount = await getPenyewaTamuStagingCount(db, scope);
            if (stagedCount !== response.length)
                throw new Error(
                    `Jumlah staging TAMU penyewa tidak lengkap: ${stagedCount}/${response.length}.`,
                );
            await publishPenyewaTamuStaging(db, scope, response.length, new Date().toISOString());
        });
    } catch (error) {
        await withDatabaseSyncLock(`tamu:${scope}:failure`, async () => {
            await clearPenyewaTamuStaging(db, scope).catch(() => undefined);
            await markPenyewaTamuDirty(db, scope).catch(() => undefined);
        }).catch(() => undefined);
        if (__DEV__) {
            const details = { scope, message: getSafeErrorMessage(error) };
            if (isRecoverableApiAvailabilityError(error)) {
                console.warn("[PENYEWA TAMU SYNC] Synchronization unavailable", details);
            } else {
                console.error("[PENYEWA TAMU SYNC] Sync failed", details);
            }
        }
        throw error;
    }
}

export async function synchronizePenyewaTamuCache(
    db: SQLiteDatabase,
    scope: string,
    force = false,
): Promise<void> {
    if (!force) {
        const active = activeSyncs.get(scope);
        if (active) return active;
    }

    if (force) {
        const active = activeSyncs.get(scope);
        if (active) await active.catch(() => undefined);
    }

    const run = runPenyewaTamuSync(db, scope).finally(() => {
        if (activeSyncs.get(scope) === run) activeSyncs.delete(scope);
    });
    activeSyncs.set(scope, run);
    return run;
}
