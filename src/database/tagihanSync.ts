import {
  tagihanApi,
  type PendingPembayaranItem,
  type TagihanReminderItem,
} from "@/api/tagihanApi";
import {
  ADMIN_PENDING_SCOPE,
  ADMIN_TAGIHAN_SCOPE,
  clearStaging,
  insertPendingStaging,
  insertTagihanStaging,
  markDirty,
  publish,
  stagingCount,
} from "@/database/tagihanRepository";
import type { PaginationMeta } from "@/types/pagination";
import type { SQLiteDatabase } from "expo-sqlite";
const SIZE = 50;
const active = new Map<string, Promise<void>>();
const integer = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;
function item(i: TagihanReminderItem) {
  if (
    !i ||
    !integer(i.id_tagihan) ||
    i.id_tagihan < 1 ||
    !integer(i.id_sewa) ||
    i.id_sewa < 1 ||
    typeof i.kode_invoice !== "string" ||
    typeof i.tanggal_jatuh_tempo !== "string" ||
    typeof i.status_tagihan !== "string" ||
    !i.penyewa ||
    !i.kamar ||
    !i.peringatan ||
    !i.whatsapp
  )
    throw new Error("Item TAGIHAN tidak valid.");
}
function pending(i: PendingPembayaranItem) {
  if (
    !i ||
    !integer(i.id_pembayaran) ||
    i.id_pembayaran < 1 ||
    !integer(i.id_tagihan) ||
    i.id_tagihan < 1 ||
    typeof i.tanggal_bayar !== "string" ||
    typeof i.metode_pembayaran !== "string" ||
    !i.tagihan
  )
    throw new Error("Pembayaran pending tidak valid.");
  item(i.tagihan);
}
function page(
  p: number,
  m: PaginationMeta,
  n: number,
  e: { total: number; last: number } | null,
) {
  const from = n ? (p - 1) * SIZE + 1 : null,
    to = n ? from! + n - 1 : null;
  if (
    !m ||
    m.current_page !== p ||
    m.per_page !== SIZE ||
    !integer(m.total) ||
    !integer(m.last_page) ||
    m.last_page !== Math.max(1, Math.ceil(m.total / SIZE)) ||
    m.from !== from ||
    m.to !== to ||
    p > m.last_page ||
    n > SIZE ||
    (p < m.last_page && !n)
  )
    throw new Error("Pagination TAGIHAN tidak valid.");
  if (e && (e.total !== m.total || e.last !== m.last_page))
    throw new Error("Dataset TAGIHAN berubah selama sinkronisasi.");
  return e ?? { total: m.total, last: m.last_page };
}
async function paged(db: SQLiteDatabase, kind: "tagihan" | "pending") {
  const scope = kind === "tagihan" ? ADMIN_TAGIHAN_SCOPE : ADMIN_PENDING_SCOPE;
  let p = 1,
    e: null | { total: number; last: number } = null,
    count = 0;
  const ids = new Set<number>();
  try {
    await clearStaging(db, kind, scope);
    do {
      let r;
      try {
        r =
          kind === "tagihan"
            ? await tagihanApi.getAdminTagihan({
                page: p,
                per_page: SIZE,
                status: "semua",
              })
            : await tagihanApi.getPendingPayments({ page: p, per_page: SIZE });
      } catch (err) {
        if (__DEV__)
          console.error(
            `[SYNC DIAGNOSTIC] API request failed. Kind: ${kind}, Page: ${p}`,
            err,
          );
        throw err;
      }

      if (__DEV__)
        console.debug(
          `[SYNC DIAGNOSTIC] API success. Kind: ${kind}, Page: ${p}, Meta:`,
          {
            current_page: r.meta.current_page,
            from: r.meta.from,
            to: r.meta.to,
            total: r.meta.total,
            last_page: r.meta.last_page,
          },
        );

      try {
        e = page(p, r.meta, r.data.length, e);
        if (__DEV__)
          console.debug(
            `[SYNC DIAGNOSTIC] Pagination validated. Kind: ${kind}, Page: ${p}, Meta:`,
            {
              current_page: r.meta.current_page,
              from: r.meta.from,
              to: r.meta.to,
              total: r.meta.total,
              last_page: r.meta.last_page,
            },
          );
      } catch (err) {
        if (__DEV__)
          console.error(
            `[SYNC DIAGNOSTIC] Pagination validation failed. Kind: ${kind}, Page: ${p}, Meta:`,
            {
              current_page: r.meta.current_page,
              from: r.meta.from,
              to: r.meta.to,
              total: r.meta.total,
              last_page: r.meta.last_page,
            },
            err,
          );
        throw err;
      }

      for (const x of r.data) {
        try {
          if (kind === "tagihan") item(x as TagihanReminderItem);
          else pending(x as PendingPembayaranItem);
        } catch (err) {
          if (__DEV__)
            console.error(
              `[SYNC DIAGNOSTIC] Item validation failed. Kind: ${kind}, Item ID: ${
                (x as any)?.id_tagihan || (x as any)?.id_pembayaran
              }`,
              err,
            );
          throw err;
        }

        const id =
          kind === "tagihan"
            ? (x as TagihanReminderItem).id_tagihan
            : (x as PendingPembayaranItem).id_pembayaran;
        if (ids.has(id)) {
          const err = new Error("ID TAGIHAN duplikat.");
          if (__DEV__) console.error(`[SYNC DIAGNOSTIC] Duplicate-ID validation failed. Kind: ${kind}, Item ID: ${id}`, err);
          throw err;
        }
        ids.add(id);
      }
      count += r.data.length;

      try {
        if (kind === "tagihan")
          await insertTagihanStaging(db, scope, r.data as TagihanReminderItem[]);
        else
          await insertPendingStaging(
            db,
            scope,
            r.data as PendingPembayaranItem[],
          );
      } catch (err) {
        if (__DEV__)
          console.error(
            `[SYNC DIAGNOSTIC] Staging insert failed. Kind: ${kind}, Page: ${p}`,
            err,
          );
        throw err;
      }

      p++;
    } while (e && p <= e.last);

    let staging_n = 0;
    try {
      staging_n = await stagingCount(db, kind, scope);
      if (
        !e ||
        count !== e.total ||
        ids.size !== e.total ||
        staging_n !== e.total
      )
        throw new Error("Snapshot TAGIHAN tidak lengkap.");
    } catch (err) {
      if (__DEV__)
        console.error(
          `[SYNC DIAGNOSTIC] Staging-count validation failed. Kind: ${kind}, Expected: ${e?.total}, Staging: ${staging_n}, Loop Count: ${count}, Set Size: ${ids.size}`,
          err,
        );
      throw err;
    }

    try {
      await publish(db, kind, scope, e.total);
      if (__DEV__)
        console.debug(
          `[SYNC DIAGNOSTIC] Publication complete. Kind: ${kind}, Total: ${e.total}, Last Page: ${e.last}`,
        );
    } catch (err) {
      if (__DEV__) console.error(`[SYNC DIAGNOSTIC] Atomic publication failed. Kind: ${kind}`, err);
      throw err;
    }
  } catch (err) {
    await clearStaging(db, kind, scope).catch(() => undefined);
    await markDirty(db, kind, scope).catch(() => undefined);
    throw err;
  }
}
async function tenant(db: SQLiteDatabase, scope: string) {
  try {
    await clearStaging(db, "tagihan", scope);
    const data = await tagihanApi.getPenyewaTagihan();
    const ids = new Set<number>();
    for (const x of data) {
      item(x);
      if (ids.has(x.id_tagihan)) throw new Error("ID TAGIHAN duplikat.");
      ids.add(x.id_tagihan);
    }
    await insertTagihanStaging(db, scope, data);
    if ((await stagingCount(db, "tagihan", scope)) !== data.length)
      throw new Error("Snapshot TAGIHAN tidak lengkap.");
    await publish(db, "tagihan", scope, data.length);
  } catch (err) {
    await clearStaging(db, "tagihan", scope).catch(() => undefined);
    await markDirty(db, "tagihan", scope).catch(() => undefined);
    throw err;
  }
}
function run(
  key: string,
  fn: () => Promise<void>,
  force = false,
): Promise<void> {
  const a = active.get(key);
  if (a) return force ? a.catch(() => undefined).then(() => run(key, fn)) : a;
  const p = fn().finally(() => active.delete(key));
  active.set(key, p);
  return p;
}
export const syncAdminTagihan = (db: SQLiteDatabase, force = false) =>
  run("tagihan:admin", () => paged(db, "tagihan"), force);
export const syncAdminPending = (db: SQLiteDatabase, force = false) =>
  run("pending:admin", () => paged(db, "pending"), force);
export const syncPenyewaTagihan = (
  db: SQLiteDatabase,
  scope: string,
  force = false,
) => run(`tagihan:${scope}`, () => tenant(db, scope), force);
