import type { SQLiteDatabase } from "expo-sqlite";

import { profileService } from "@/api/profileService";
import { getCachedUser, saveCachedUser } from "@/auth/tokenStorage";
import { withDatabaseSyncLock } from "@/database/databaseSyncLock";
import {
  markProfileCacheDirty,
  publishProfileSnapshot,
} from "@/database/profileRepository";
import type { UserRole } from "@/types";
import type { ProfileResponse, ProfileUser } from "@/types/profile";
import {
  getSafeErrorMessage,
  isRecoverableApiAvailabilityError,
} from "@/utils/apiErrors";

const activeSyncs = new Map<string, Promise<void>>();

function parseScope(scope: string): { role: UserRole; userId: number } {
  const match = scope.match(/^(admin|penyewa):(\d+)$/);
  const userId = match ? Number(match[2]) : Number.NaN;
  if (!match || !Number.isInteger(userId) || userId < 1)
    throw new Error("Scope profil tidak valid.");
  return { role: match[1] as UserRole, userId };
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOptionalString(
  value: unknown,
  fieldName: string,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(
      `Field profil opsional tidak valid: ${fieldName} (${typeof value}).`,
    );
  }

  return value;
}

function normalizeOptionalObject(
  value: unknown,
  fieldName: string,
): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `Relasi profil tidak valid: ${fieldName} (${typeof value}).`,
    );
  }

  return value as Record<string, unknown>;
}

function normalizeProfileResponse(
  response: ProfileResponse,
  scope: string,
  expectedRole: UserRole,
): ProfileUser {
  const { role, userId } = parseScope(scope);
  const user = response?.user;

  if (!user || typeof user !== "object") {
    throw new Error("Respons profil tidak memiliki user yang valid.");
  }

  if (!Number.isInteger(user.id) || user.id < 1 || user.id !== userId) {
    throw new Error("ID user profil tidak sesuai dengan akun aktif.");
  }

  if (
    (user.role !== "admin" && user.role !== "penyewa") ||
    user.role !== role
  ) {
    throw new Error("Role profil tidak sesuai dengan scope akun aktif.");
  }

  if (user.role !== expectedRole) {
    throw new Error("Role profil tidak sesuai dengan route yang diminta.");
  }

  if (!text(user.nama_lengkap) || !text(user.email)) {
    throw new Error("Profil wajib memiliki nama dan email yang valid.");
  }

  const noHp = normalizeOptionalString(user.no_hp, "no_hp");
  const fotoProfil = normalizeOptionalString(user.foto_profil, "foto_profil");
  const alamatAsal = normalizeOptionalString(user.alamat_asal, "alamat_asal");
  const createdAt = normalizeOptionalString(user.created_at, "created_at");
  const updatedAt = normalizeOptionalString(user.updated_at, "updated_at");
  const topLevelStatusSewa = normalizeOptionalString(
    user.status_sewa,
    "status_sewa",
  );

  const sewa = normalizeOptionalObject(user.sewa, "sewa");
  const kamar = normalizeOptionalObject(user.kamar, "kamar");

  const tanggalMasuk = normalizeOptionalString(
    sewa?.tanggal_masuk,
    "sewa.tanggal_masuk",
  );
  const tanggalKeluar = normalizeOptionalString(
    sewa?.tanggal_keluar,
    "sewa.tanggal_keluar",
  );
  const nestedStatusSewa = normalizeOptionalString(
    sewa?.status_sewa,
    "sewa.status_sewa",
  );

  const nomorKamar = normalizeOptionalString(
    kamar?.nomor_kamar,
    "kamar.nomor_kamar",
  );
  const statusKamar = normalizeOptionalString(
    kamar?.status_kamar,
    "kamar.status_kamar",
  );

  return {
    id: user.id,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    role: user.role,
    no_hp: noHp,
    foto_profil: fotoProfil,
    alamat_asal: alamatAsal,
    created_at: createdAt,
    updated_at: updatedAt,
    status_sewa: topLevelStatusSewa ?? nestedStatusSewa,
    sewa: sewa
      ? {
          tanggal_masuk: tanggalMasuk,
          tanggal_keluar: tanggalKeluar,
          status_sewa: nestedStatusSewa,
        }
      : null,
    kamar: kamar
      ? {
          nomor_kamar: nomorKamar,
          status_kamar: statusKamar,
        }
      : null,
  };
}

async function runProfileSync(
  db: SQLiteDatabase,
  scope: string,
  expectedRole: UserRole,
): Promise<void> {
  const { userId, role } = parseScope(scope);
  try {
    const response = await profileService.getProfile();
    const normalized = normalizeProfileResponse(response, scope, expectedRole);
    await withDatabaseSyncLock(`profile:${scope}`, () =>
      publishProfileSnapshot(
        db,
        scope,
        normalized,
        new Date().toISOString(),
      ),
    );
    const currentCachedUser = await getCachedUser();
    if (
      currentCachedUser &&
      currentCachedUser.id === normalized.id &&
      currentCachedUser.role === normalized.role
    ) {
      await saveCachedUser({
        id: normalized.id,
        nama_lengkap: normalized.nama_lengkap,
        email: normalized.email,
        role: normalized.role,
      });
    }
  } catch (error) {
    await withDatabaseSyncLock(`profile:${scope}:failure`, async () => {
      await markProfileCacheDirty(db, scope).catch(() => undefined);
    },
    ).catch(() => undefined);
    if (__DEV__) {
      const details = {
        scope,
        userId,
        role,
        message: getSafeErrorMessage(error),
      };
      if (isRecoverableApiAvailabilityError(error)) {
        console.warn("[PROFILE SYNC] Synchronization unavailable", details);
      } else {
        console.error("[PROFILE SYNC] Sync failed", details);
      }
    }
    throw error;
  }
}

export async function synchronizeProfile(
  db: SQLiteDatabase,
  scope: string,
  expectedRole: UserRole,
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

  const run = runProfileSync(db, scope, expectedRole).finally(() => {
    if (activeSyncs.get(scope) === run) activeSyncs.delete(scope);
  });
  activeSyncs.set(scope, run);
  return run;
}
