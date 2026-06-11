import type { SQLiteDatabase } from "expo-sqlite";

import { keluhanService } from "@/api/keluhanService";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import {
    clearPenyewaKeluhanStaging,
    getPenyewaKeluhanStagingCount,
    insertPenyewaKeluhanStaging,
    markPenyewaKeluhanDirty,
    publishPenyewaKeluhanStaging,
} from "@/database/penyewaKeluhanRepository";
import type { Keluhan } from "@/types";
import {
    getSafeErrorMessage,
    isRecoverableApiAvailabilityError,
} from "@/utils/apiErrors";

const active = new Map<string, Promise<void>>();

function isInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function isNullableString(value: unknown): boolean {
    return value === null || typeof value === "string";
}

function validateItem(item: Keluhan): void {
    if (
        !item ||
        typeof item !== "object" ||
        !isInteger(item.id_keluhan) ||
        item.id_keluhan < 1 ||
        !isInteger(item.id_sewa) ||
        item.id_sewa < 1 ||
        typeof item.judul_keluhan !== "string" ||
        typeof item.deskripsi_keluhan !== "string" ||
        !isNullableString(item.foto_kerusakan) ||
        !isNullableString(item.foto_kerusakan_url) ||
        !["pending", "proses", "selesai"].includes(item.status_keluhan) ||
        typeof item.tanggal_lapor !== "string" ||
        item.tanggal_lapor.length === 0 ||
        !isNullableString(item.tanggal_selesai) ||
        typeof item.nama_penghuni !== "string" ||
        typeof item.email_penghuni !== "string" ||
        typeof item.nomor_kamar !== "string"
    ) {
        throw new Error("Respons sinkronisasi KELUHAN penyewa memiliki item yang tidak valid.");
    }
}

async function runPenyewaKeluhanSync(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    try {
        const response = await keluhanService.getPenyewaKeluhans();
        if (!Array.isArray(response))
            throw new Error("Respons sinkronisasi KELUHAN penyewa tidak valid.");
        const seenIds = new Set<number>();
        for (const item of response) {
            validateItem(item);
            if (seenIds.has(item.id_keluhan))
                throw new Error(
                    `Sinkronisasi KELUHAN penyewa berisi id_keluhan duplikat: ${item.id_keluhan}.`,
                );
            seenIds.add(item.id_keluhan);
        }
        await withDatabaseSyncLock(`keluhan:${scope}`, async () => {
            await clearPenyewaKeluhanStaging(db, scope);
            await insertPenyewaKeluhanStaging(db, scope, response);
            const stagedCount = await getPenyewaKeluhanStagingCount(db, scope);
            if (stagedCount !== response.length)
                throw new Error(
                    `Jumlah staging KELUHAN penyewa tidak lengkap: ${stagedCount}/${response.length}.`,
                );
            await publishPenyewaKeluhanStaging(
                db,
                scope,
                response.length,
                new Date().toISOString(),
            );
        });
    } catch (error) {
        await withDatabaseSyncLock(`keluhan:${scope}:failure`, async () => {
            await clearPenyewaKeluhanStaging(db, scope).catch(() => undefined);
            await markPenyewaKeluhanDirty(db, scope).catch(() => undefined);
        }).catch(() => undefined);
        if (__DEV__) {
            const details = {
                scope,
                message: getSafeErrorMessage(error),
            };
            if (isRecoverableApiAvailabilityError(error)) {
                console.warn("[PENYEWA KELUHAN SYNC] Synchronization unavailable", details);
            } else {
                console.error("[PENYEWA KELUHAN SYNC] Synchronization failed", details);
            }
        }
        throw error;
    }
}

export function synchronizePenyewaKeluhanCache(
    db: SQLiteDatabase,
    scope: string,
    requireNewRun = false,
): Promise<void> {
    const current = active.get(scope);
    if (current) {
        if (requireNewRun)
            return current
                .catch(() => undefined)
                .then(() => synchronizePenyewaKeluhanCache(db, scope, false));
        return current;
    }
    const promise = runPenyewaKeluhanSync(db, scope).finally(() => {
        active.delete(scope);
    });
    active.set(scope, promise);
    return promise;
}
