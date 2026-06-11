import type { SQLiteDatabase } from "expo-sqlite";

import {
  getDashboardMetadata,
  hasDashboardSnapshot,
} from "@/database/dashboardRepository";
import {
  syncAdminDashboard,
  syncPenyewaDashboard,
} from "@/database/dashboardSync";
import {
  getKamarSyncMetadata,
  hasKamarCache,
} from "@/database/kamarRepository";
import { synchronizeKamarCache } from "@/database/kamarSync";
import {
  getKeluhanSyncMetadata,
  hasKeluhanSnapshot,
} from "@/database/keluhanRepository";
import { synchronizeKeluhanCache } from "@/database/keluhanSync";
import {
  getLaporanKeuanganMetadata,
  hasValidLaporanKeuanganSnapshot,
} from "@/database/laporanKeuanganRepository";
import { syncLaporanKeuangan } from "@/database/laporanKeuanganSync";
import {
  getPenghuniSyncMetadata,
  hasPenghuniSnapshot,
} from "@/database/penghuniRepository";
import { synchronizePenghuniCache } from "@/database/penghuniSync";
import {
  getPenyewaKeluhanMetadata,
  hasPenyewaKeluhanSnapshot,
} from "@/database/penyewaKeluhanRepository";
import { synchronizePenyewaKeluhanCache } from "@/database/penyewaKeluhanSync";
import {
  getPenyewaTamuMetadata,
  hasPenyewaTamuSnapshot,
} from "@/database/penyewaTamuRepository";
import { synchronizePenyewaTamuCache } from "@/database/penyewaTamuSync";
import {
  getCachedProfile,
  getProfileSyncMetadata,
  hasCachedProfileSnapshot,
} from "@/database/profileRepository";
import { synchronizeProfile } from "@/database/profileSync";
import { getMetadata, hasSnapshot } from "@/database/tagihanRepository";
import {
  syncAdminPending,
  syncAdminTagihan,
  syncPenyewaTagihan,
} from "@/database/tagihanSync";
import { getTamuSyncMetadata, hasTamuCache } from "@/database/tamuRepository";
import { synchronizeTamuCache } from "@/database/tamuSync";
import type { User, UserRole } from "@/types";

const CACHE_FRESHNESS_MS = 5 * 60 * 1000;
const PRELOAD_CONCURRENCY = 1;

type StartupTask = { module: string; run: () => Promise<void> };

function isFresh(lastSyncedAt: string | null) {
  const timestamp = lastSyncedAt ? Date.parse(lastSyncedAt) : Number.NaN;
  return (
    Number.isFinite(timestamp) && Date.now() - timestamp < CACHE_FRESHNESS_MS
  );
}

function currentLocalPeriod(now = new Date()) {
  return { tahun: now.getFullYear(), bulan: now.getMonth() + 1 };
}

function validUser(user: User | null): user is User & { role: UserRole } {
  return Boolean(
    user &&
    Number.isInteger(user.id) &&
    user.id > 0 &&
    (user.role === "admin" || user.role === "penyewa"),
  );
}

function isAdminUser(user: User): user is User & { role: "admin" } {
  return user.role === "admin";
}

function isPenyewaUser(user: User): user is User & { role: "penyewa" } {
  return user.role === "penyewa";
}

async function shouldPreloadFromMetadata(
  hasSnapshot: boolean,
  metadata: { lastSyncedAt: string | null; isDirty: boolean },
) {
  return !hasSnapshot || metadata.isDirty || !isFresh(metadata.lastSyncedAt);
}

async function shouldPreloadProfile(db: SQLiteDatabase, scope: string) {
  const metadata = await getProfileSyncMetadata(db, scope);
  if (!(await hasCachedProfileSnapshot(db, scope))) {
    return true;
  }
  try {
    if (!(await getCachedProfile(db, scope))) {
      return true;
    }
  } catch {
    return true;
  }
  return shouldPreloadFromMetadata(true, metadata);
}

async function createAdminTasks(
  db: SQLiteDatabase,
  user: User & { role: "admin" },
): Promise<StartupTask[]> {
  const scope = `admin:${user.id}`;
  const { bulan, tahun } = currentLocalPeriod();
  const [
    dashboardSnapshot,
    dashboardMetadata,
    profileNeeded,
    kamarCache,
    kamarMetadata,
    penghuniSnapshot,
    penghuniMetadata,
    tamuCache,
    tamuMetadata,
    keluhanSnapshot,
    keluhanMetadata,
    tagihanSnapshot,
    tagihanMetadata,
    pendingSnapshot,
    pendingMetadata,
    laporanSnapshot,
    laporanMetadata,
  ] = await Promise.all([
    hasDashboardSnapshot(db, "admin"),
    getDashboardMetadata(db, "admin"),
    shouldPreloadProfile(db, scope),
    hasKamarCache(db),
    getKamarSyncMetadata(db),
    hasPenghuniSnapshot(db),
    getPenghuniSyncMetadata(db),
    hasTamuCache(db),
    getTamuSyncMetadata(db),
    hasKeluhanSnapshot(db),
    getKeluhanSyncMetadata(db),
    hasSnapshot(db, "tagihan", "admin"),
    getMetadata(db, "tagihan", "admin"),
    hasSnapshot(db, "pending", "admin"),
    getMetadata(db, "pending", "admin"),
    hasValidLaporanKeuanganSnapshot(db, bulan, tahun),
    getLaporanKeuanganMetadata(db, bulan, tahun),
  ]);

  const tasks: StartupTask[] = [];

  if (await shouldPreloadFromMetadata(dashboardSnapshot, dashboardMetadata))
    tasks.push({
      module: "Admin Dashboard",
      run: () => syncAdminDashboard(db, false),
    });
  if (profileNeeded)
    tasks.push({
      module: "Profile",
      run: () => synchronizeProfile(db, scope, "admin", false),
    });
  if (await shouldPreloadFromMetadata(kamarCache, kamarMetadata))
    tasks.push({ module: "Kamar", run: () => synchronizeKamarCache(db) });
  if (await shouldPreloadFromMetadata(penghuniSnapshot, penghuniMetadata))
    tasks.push({ module: "Penghuni", run: () => synchronizePenghuniCache(db) });
  if (await shouldPreloadFromMetadata(tamuCache, tamuMetadata))
    tasks.push({ module: "Tamu", run: () => synchronizeTamuCache(db) });
  if (await shouldPreloadFromMetadata(keluhanSnapshot, keluhanMetadata))
    tasks.push({
      module: "Keluhan",
      run: () => synchronizeKeluhanCache(db, false),
    });
  if (await shouldPreloadFromMetadata(tagihanSnapshot, tagihanMetadata))
    tasks.push({ module: "Tagihan", run: () => syncAdminTagihan(db, false) });
  if (await shouldPreloadFromMetadata(pendingSnapshot, pendingMetadata))
    tasks.push({
      module: "Pending Payment",
      run: () => syncAdminPending(db, false),
    });
  if (await shouldPreloadFromMetadata(laporanSnapshot, laporanMetadata))
    tasks.push({
      module: `Laporan ${tahun}-${String(bulan).padStart(2, "0")}`,
      run: () => syncLaporanKeuangan(db, bulan, tahun, false),
    });

  return tasks;
}

async function createPenyewaTasks(
  db: SQLiteDatabase,
  user: User & { role: "penyewa" },
): Promise<StartupTask[]> {
  const scope = `penyewa:${user.id}`;
  const [
    dashboardSnapshot,
    dashboardMetadata,
    profileNeeded,
    tagihanSnapshot,
    tagihanMetadata,
    keluhanSnapshot,
    keluhanMetadata,
    tamuSnapshot,
    tamuMetadata,
  ] = await Promise.all([
    hasDashboardSnapshot(db, scope),
    getDashboardMetadata(db, scope),
    shouldPreloadProfile(db, scope),
    hasSnapshot(db, "tagihan", scope),
    getMetadata(db, "tagihan", scope),
    hasPenyewaKeluhanSnapshot(db, scope),
    getPenyewaKeluhanMetadata(db, scope),
    hasPenyewaTamuSnapshot(db, scope),
    getPenyewaTamuMetadata(db, scope),
  ]);

  const tasks: StartupTask[] = [];

  if (await shouldPreloadFromMetadata(dashboardSnapshot, dashboardMetadata))
    tasks.push({
      module: "Penyewa Dashboard",
      run: () => syncPenyewaDashboard(db, user.id, false),
    });
  if (profileNeeded)
    tasks.push({
      module: "Profile",
      run: () => synchronizeProfile(db, scope, "penyewa", false),
    });
  if (await shouldPreloadFromMetadata(tagihanSnapshot, tagihanMetadata))
    tasks.push({
      module: "Tagihan",
      run: () => syncPenyewaTagihan(db, scope, false),
    });
  if (await shouldPreloadFromMetadata(keluhanSnapshot, keluhanMetadata))
    tasks.push({
      module: "Keluhan",
      run: () => synchronizePenyewaKeluhanCache(db, scope, false),
    });
  if (await shouldPreloadFromMetadata(tamuSnapshot, tamuMetadata))
    tasks.push({
      module: "Tamu",
      run: () => synchronizePenyewaTamuCache(db, scope, false),
    });

  return tasks;
}

export async function buildStartupPreloadTasks(
  db: SQLiteDatabase,
  user: User | null,
): Promise<{ role: UserRole; scope: string; tasks: StartupTask[] } | null> {
  if (!validUser(user)) return null;
  if (isAdminUser(user)) {
    return {
      role: "admin",
      scope: `admin:${user.id}`,
      tasks: await createAdminTasks(db, user),
    };
  }
  if (!isPenyewaUser(user)) return null;
  return {
    role: "penyewa",
    scope: `penyewa:${user.id}`,
    tasks: await createPenyewaTasks(db, user),
  };
}

export async function runBoundedStartupTasks(
  tasks: StartupTask[],
  details: { role: UserRole; scope: string },
) {
  let index = 0;
  const results: PromiseSettledResult<void>[] = [];

  const worker = async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= tasks.length) return;
      const task = tasks[current];
      try {
        await task.run();
        results[current] = { status: "fulfilled", value: undefined };
        if (__DEV__) {
          console.debug("[STARTUP PRELOAD] Module success", {
            module: task.module,
            role: details.role,
            scope: details.scope,
            outcome: "success",
          });
        }
      } catch (error) {
        results[current] = { status: "rejected", reason: error };
        if (__DEV__) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          console.warn("[STARTUP PRELOAD] Module failed", {
            module: task.module,
            role: details.role,
            scope: details.scope,
            outcome: "failure",
            message,
          });
        }
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(PRELOAD_CONCURRENCY, tasks.length) },
    () => worker(),
  );
  await Promise.allSettled(workers);
  return results;
}
