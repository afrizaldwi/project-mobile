import type { SQLiteDatabase } from "expo-sqlite";

import {
    normalizeNullableProfileKamarStatus,
    normalizeNullableProfileSewaStatus,
    type ProfileUser,
} from "@/types/profile";
import type { UserRole } from "@/types";

type MetadataRow = { last_synced_at: string; is_dirty: number };
type ProfileRow = {
    scope_key: string;
    id_user: number;
    role: UserRole;
    nama_lengkap: string;
    email: string;
    no_hp: string | null;
    foto_profil: string | null;
    alamat_asal: string | null;
    created_at: string | null;
    updated_at: string | null;
    status_sewa: string | null;
    nomor_kamar: string | null;
    status_kamar: string | null;
    tanggal_masuk: string | null;
    tanggal_keluar: string | null;
};

const profileResource = (scope: string) => `profile:${scope}`;

function parseScope(scope: string): { role: UserRole; userId: number } {
    const match = scope.match(/^(admin|penyewa):(\d+)$/);
    const userId = match ? Number(match[2]) : Number.NaN;
    if (!match || !Number.isInteger(userId) || userId < 1)
        throw new Error("Scope profil tidak valid.");
    return { role: match[1] as UserRole, userId };
}

function mapRowToProfile(row: ProfileRow): ProfileUser {
    const scope = parseScope(row.scope_key);
    if (row.id_user !== scope.userId || row.role !== scope.role)
        throw new Error("Row profil tidak cocok dengan scope tersimpan.");
    return {
        id: row.id_user,
        role: row.role,
        nama_lengkap: row.nama_lengkap,
        email: row.email,
        no_hp: row.no_hp,
        foto_profil: row.foto_profil,
        alamat_asal: row.alamat_asal,
        created_at: row.created_at,
        updated_at: row.updated_at,
        status_sewa: normalizeNullableProfileSewaStatus(
            row.status_sewa,
            "cache.status_sewa",
        ),
        kamar:
            row.nomor_kamar !== null || row.status_kamar !== null
                ? {
                      nomor_kamar: row.nomor_kamar,
                      status_kamar: normalizeNullableProfileKamarStatus(
                          row.status_kamar,
                          "cache.kamar.status_kamar",
                      ),
                  }
                : null,
        sewa:
            row.tanggal_masuk !== null ||
            row.tanggal_keluar !== null ||
            row.status_sewa !== null
                ? {
                      tanggal_masuk: row.tanggal_masuk,
                      tanggal_keluar: row.tanggal_keluar,
                      status_sewa: normalizeNullableProfileSewaStatus(
                          row.status_sewa,
                          "cache.sewa.status_sewa",
                      ),
                  }
                : null,
    };
}

export function getProfileResourceName(scope: string): string {
    parseScope(scope);
    return profileResource(scope);
}

export async function getCachedProfile(
    db: SQLiteDatabase,
    scope: string,
): Promise<ProfileUser | null> {
    parseScope(scope);
    const row = await db.getFirstAsync<ProfileRow>(
        `SELECT scope_key, id_user, role, nama_lengkap, email, no_hp, foto_profil,
                alamat_asal, created_at, updated_at, status_sewa, nomor_kamar,
                status_kamar, tanggal_masuk, tanggal_keluar
         FROM profile_cache
         WHERE scope_key = ?`,
        scope,
    );
    if (!row) return null;
    return mapRowToProfile(row);
}

export async function hasCachedProfileSnapshot(
    db: SQLiteDatabase,
    scope: string,
): Promise<boolean> {
    const metadata = await getProfileSyncMetadata(db, scope);
    if (!metadata.lastSyncedAt) return false;
    try {
        const snapshot = await getCachedProfile(db, scope);
        if (!snapshot) {
            await markProfileCacheDirty(db, scope).catch(() => undefined);
            return false;
        }
        return true;
    } catch {
        await markProfileCacheDirty(db, scope).catch(() => undefined);
        return false;
    }
}

export async function getProfileSyncMetadata(
    db: SQLiteDatabase,
    scope: string,
): Promise<{ lastSyncedAt: string | null; isDirty: boolean }> {
    const row = await db.getFirstAsync<MetadataRow>(
        "SELECT last_synced_at, is_dirty FROM sync_metadata WHERE resource_name = ?",
        profileResource(scope),
    );
    return { lastSyncedAt: row?.last_synced_at || null, isDirty: row?.is_dirty === 1 };
}

export async function markProfileCacheDirty(
    db: SQLiteDatabase,
    scope: string,
): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, '', 1)
         ON CONFLICT(resource_name) DO UPDATE SET is_dirty = 1`,
        profileResource(scope),
    );
}

export async function publishProfileSnapshot(
    db: SQLiteDatabase,
    scope: string,
    profile: ProfileUser,
    syncedAt: string,
): Promise<void> {
    const parsedScope = parseScope(scope);
    if (profile.id !== parsedScope.userId || profile.role !== parsedScope.role)
        throw new Error("Snapshot profil tidak cocok dengan scope publikasi.");

    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
            `INSERT INTO profile_cache (
                scope_key, id_user, role, nama_lengkap, email, no_hp, foto_profil,
                alamat_asal, created_at, updated_at, status_sewa, nomor_kamar,
                status_kamar, tanggal_masuk, tanggal_keluar
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(scope_key) DO UPDATE SET
                id_user = excluded.id_user,
                role = excluded.role,
                nama_lengkap = excluded.nama_lengkap,
                email = excluded.email,
                no_hp = excluded.no_hp,
                foto_profil = excluded.foto_profil,
                alamat_asal = excluded.alamat_asal,
                created_at = excluded.created_at,
                updated_at = excluded.updated_at,
                status_sewa = excluded.status_sewa,
                nomor_kamar = excluded.nomor_kamar,
                status_kamar = excluded.status_kamar,
                tanggal_masuk = excluded.tanggal_masuk,
                tanggal_keluar = excluded.tanggal_keluar`,
            scope,
            profile.id,
            profile.role,
            profile.nama_lengkap,
            profile.email,
            profile.no_hp ?? null,
            profile.foto_profil ?? null,
            profile.alamat_asal ?? null,
            profile.created_at ?? null,
            profile.updated_at ?? null,
            profile.status_sewa ?? null,
            profile.kamar?.nomor_kamar ?? null,
            profile.kamar?.status_kamar ?? null,
            profile.sewa?.tanggal_masuk ?? null,
            profile.sewa?.tanggal_keluar ?? null,
        );
        await txn.runAsync(
            `INSERT INTO sync_metadata (resource_name, last_synced_at, is_dirty) VALUES (?, ?, 0)
             ON CONFLICT(resource_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, is_dirty = 0`,
            profileResource(scope),
            syncedAt,
        );
    });
}
