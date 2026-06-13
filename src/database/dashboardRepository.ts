import {
  DASHBOARD_KAMAR_STATUSES,
  DASHBOARD_KELUHAN_STATUSES,
  DASHBOARD_TAGIHAN_STATUSES,
  type AdminDashboardSummary,
  type DashboardKamarStatus,
  type DashboardKeluhanStatus,
  type DashboardTagihanStatus,
  type PenyewaDashboardSummary,
} from "@/types/dashboard";
import type { SQLiteDatabase } from "expo-sqlite";

type MetadataRow = { last_synced_at: string; is_dirty: number };
type PayloadRow = { payload_json: string };
type DashboardSummary = AdminDashboardSummary | PenyewaDashboardSummary;

const complaintStatuses = new Set<DashboardKeluhanStatus>(
  DASHBOARD_KELUHAN_STATUSES,
);
const roomStatuses = new Set<DashboardKamarStatus>(
  DASHBOARD_KAMAR_STATUSES,
);
const invoiceStatuses = new Set<DashboardTagihanStatus>(
  DASHBOARD_TAGIHAN_STATUSES,
);
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => typeof value === "string";
const nonEmpty = (value: unknown) => text(value) && value.trim().length > 0;
const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const money = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0)
    return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  )
    return Number(value);
  return null;
};
const nullableText = (value: unknown) => value === null || text(value);
const roomStatus = (value: unknown): value is DashboardKamarStatus =>
  typeof value === "string" &&
  roomStatuses.has(value as DashboardKamarStatus);
const invoiceStatus = (value: unknown): value is DashboardTagihanStatus =>
  typeof value === "string" &&
  invoiceStatuses.has(value as DashboardTagihanStatus);
const paymentStatus = (
  value: unknown,
): value is DashboardTagihanStatus | "-" =>
  value === "-" || invoiceStatus(value);
const complaints = (value: unknown) =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      object(item) &&
      nonEmpty(item.judul) &&
      complaintStatuses.has(item.status as DashboardKeluhanStatus) &&
      text(item.tanggal),
  );

export function normalizeAdminDashboard(value: unknown): AdminDashboardSummary {
  if (!object(value) || !object(value.cards) || !object(value.charts))
    throw new Error("Snapshot dashboard admin tidak valid.");
  const cards = value.cards;
  const charts = value.charts;
  const cardKeys = [
    "total_kamar",
    "penghuni_aktif",
    "tagihan_belum_dibayar",
    "pendapatan_bulan_ini",
    "keluhan_pending",
  ];
  const chartGroups = {
    status_kamar: ["tersedia", "terisi", "perbaikan"],
    status_tagihan: ["belum_bayar", "lunas", "telat"],
    status_keluhan: ["pending", "proses", "selesai"],
  };
  if (
    cardKeys.some((key) => !count(cards[key])) ||
    Object.entries(chartGroups).some(
      ([group, keys]) =>
        !object(charts[group]) ||
        keys.some(
          (key) => !count((charts[group] as Record<string, unknown>)[key]),
        ),
    ) ||
    !complaints(value.recent_keluhan)
  )
    throw new Error("Snapshot dashboard admin tidak valid.");
  return value as AdminDashboardSummary;
}

export function normalizePenyewaDashboard(
  value: unknown,
): PenyewaDashboardSummary {
  if (!object(value) || !object(value.cards))
    throw new Error("Snapshot dashboard penyewa tidak valid.");
  const cards = value.cards;
  if (
    !text(cards.kamar_saya) ||
    !count(cards.tagihan_aktif) ||
    !paymentStatus(cards.status_pembayaran) ||
    !text(cards.sisa_masa_sewa) ||
    !count(cards.keluhan_saya) ||
    !complaints(value.keluhan_terakhir)
  )
    throw new Error("Snapshot dashboard penyewa tidak valid.");

  let kamar: PenyewaDashboardSummary["kamar"] = null;
  if (value.kamar !== null) {
    if (
      !object(value.kamar) ||
      !nullableText(value.kamar.nomor_kamar) ||
      !nullableText(value.kamar.fasilitas) ||
      !(
        value.kamar.status_kamar === null ||
        roomStatus(value.kamar.status_kamar)
      )
    )
      throw new Error("Snapshot kamar dashboard penyewa tidak valid.");
    const harga =
      value.kamar.harga_bulanan === null
        ? null
        : money(value.kamar.harga_bulanan);
    if (value.kamar.harga_bulanan !== null && harga === null)
      throw new Error("Harga kamar dashboard penyewa tidak valid.");
    kamar = {
      ...value.kamar,
      harga_bulanan: harga,
    } as PenyewaDashboardSummary["kamar"];
  }

  let tagihan: PenyewaDashboardSummary["tagihan_terbaru"] = null;
  if (value.tagihan_terbaru !== null) {
    if (
      !object(value.tagihan_terbaru) ||
      !nonEmpty(value.tagihan_terbaru.kode_invoice) ||
      !text(value.tagihan_terbaru.tanggal_jatuh_tempo) ||
      !invoiceStatus(value.tagihan_terbaru.status_tagihan)
    )
      throw new Error("Snapshot tagihan dashboard penyewa tidak valid.");
    const total = money(value.tagihan_terbaru.total_tagihan);
    if (total === null)
      throw new Error("Total tagihan dashboard penyewa tidak valid.");
    tagihan = {
      ...value.tagihan_terbaru,
      total_tagihan: total,
    } as PenyewaDashboardSummary["tagihan_terbaru"];
  }

  let kontrak: PenyewaDashboardSummary["kontrak"] = null;
  if (value.kontrak !== null) {
    if (
      !object(value.kontrak) ||
      !validDate(value.kontrak.tanggal_masuk) ||
      !(
        value.kontrak.tanggal_keluar === null ||
        validDate(value.kontrak.tanggal_keluar)
      ) ||
      !Number.isInteger(value.kontrak.durasi_sewa_bulan) ||
      (value.kontrak.durasi_sewa_bulan as number) <= 0 ||
      value.kontrak.status_sewa !== "aktif" ||
      !count(value.kontrak.progress_persen) ||
      !text(value.kontrak.sisa_masa_sewa)
    )
      throw new Error("Snapshot kontrak dashboard penyewa tidak valid.");
    kontrak = value.kontrak as PenyewaDashboardSummary["kontrak"];
  }
  return {
    cards: value.cards as PenyewaDashboardSummary["cards"],
    kamar,
    tagihan_terbaru: tagihan,
    kontrak,
    keluhan_terakhir:
      value.keluhan_terakhir as PenyewaDashboardSummary["keluhan_terakhir"],
  };
}

const dateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
    ? date
    : null;
};
const validDate = (value: unknown): value is string =>
  typeof value === "string" && dateParts(value) !== null;
const jakartaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
};
const addCalendarMonths = (date: Date, months: number) => {
  const targetMonth = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
};

function refreshContract(
  summary: PenyewaDashboardSummary,
): PenyewaDashboardSummary {
  if (!summary.kontrak) return summary;
  const start = dateParts(summary.kontrak.tanggal_masuk);
  if (!start) {
    if (__DEV__)
      console.warn("[DASHBOARD CACHE] Invalid penyewa contract start date.");
    return summary;
  }
  const end = addCalendarMonths(start, summary.kontrak.durasi_sewa_bulan);
  const today = jakartaToday();
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86400000),
  );
  const elapsed = Math.round((today.getTime() - start.getTime()) / 86400000);
  const progress =
    today <= start
      ? 0
      : today >= end
        ? 100
        : Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  const remaining =
    today >= end
      ? "Selesai"
      : `${Math.max(
          1,
          (end.getUTCFullYear() - today.getUTCFullYear()) * 12 +
            end.getUTCMonth() -
            today.getUTCMonth() +
            (end.getUTCDate() > today.getUTCDate() ? 1 : 0),
        )} bulan`;
  return {
    ...summary,
    cards: { ...summary.cards, sisa_masa_sewa: remaining },
    kontrak: {
      ...summary.kontrak,
      progress_persen: progress,
      sisa_masa_sewa: remaining,
    },
  };
}

const resource = (scope: string) => `dashboard:${scope}`;
export async function readDashboardSnapshot(
  db: SQLiteDatabase,
  scope: string,
): Promise<DashboardSummary> {
  const row = await db.getFirstAsync<PayloadRow>(
    "SELECT payload_json FROM dashboard_cache WHERE scope_key=?",
    scope,
  );
  if (!row) throw new Error("Snapshot dashboard belum tersedia.");
  try {
    const parsed = JSON.parse(row.payload_json);
    return scope === "admin"
      ? normalizeAdminDashboard(parsed)
      : refreshContract(normalizePenyewaDashboard(parsed));
  } catch (error) {
    if (__DEV__)
      console.error(
        `[DASHBOARD CACHE] Invalid cached JSON. Scope: ${scope}`,
        error,
      );
    throw new Error("Snapshot dashboard lokal tidak valid.");
  }
}
export async function hasDashboardSnapshot(db: SQLiteDatabase, scope: string) {
  return Boolean(
    await db.getFirstAsync(
      "SELECT 1 FROM dashboard_cache WHERE scope_key=?",
      scope,
    ),
  );
}
export async function getDashboardMetadata(db: SQLiteDatabase, scope: string) {
  const row = await db.getFirstAsync<MetadataRow>(
    "SELECT last_synced_at,is_dirty FROM sync_metadata WHERE resource_name=?",
    resource(scope),
  );
  return {
    lastSyncedAt: row?.last_synced_at || null,
    isDirty: row?.is_dirty === 1,
  };
}
export async function markDashboardDirty(db: SQLiteDatabase, scope: string) {
  await db.runAsync(
    "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,'',1) ON CONFLICT(resource_name) DO UPDATE SET is_dirty=1",
    resource(scope),
  );
}
export async function clearDashboardStaging(db: SQLiteDatabase, scope: string) {
  await db.runAsync(
    "DELETE FROM dashboard_cache_staging WHERE scope_key=?",
    scope,
  );
}
export async function insertDashboardStaging(
  db: SQLiteDatabase,
  scope: string,
  payload: DashboardSummary,
) {
  await db.runAsync(
    "INSERT OR REPLACE INTO dashboard_cache_staging(scope_key,payload_json) VALUES(?,?)",
    scope,
    JSON.stringify(payload),
  );
}
export async function publishDashboard(db: SQLiteDatabase, scope: string) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    const staged = await txn.getFirstAsync<PayloadRow>(
      "SELECT payload_json FROM dashboard_cache_staging WHERE scope_key=?",
      scope,
    );
    if (!staged) throw new Error("Snapshot staging dashboard tidak tersedia.");
    await txn.runAsync(
      "INSERT OR REPLACE INTO dashboard_cache(scope_key,payload_json) VALUES(?,?)",
      scope,
      staged.payload_json,
    );
    await txn.runAsync(
      "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,?,0) ON CONFLICT(resource_name) DO UPDATE SET last_synced_at=excluded.last_synced_at,is_dirty=0",
      resource(scope),
      new Date().toISOString(),
    );
    await txn.runAsync(
      "DELETE FROM dashboard_cache_staging WHERE scope_key=?",
      scope,
    );
  });
}
