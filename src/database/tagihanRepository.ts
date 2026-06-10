import type {
    AdminTagihanListResponse,
    AdminTagihanStatus,
    AdminTagihanSummary,
    PendingPembayaranItem,
    TagihanReminderItem,
} from "@/api/tagihanApi";
import type { PaginationMeta } from "@/types/pagination";
import type { SQLiteDatabase } from "expo-sqlite";

type CountRow = { count: number };
type MetaRow = { last_synced_at: string; is_dirty: number };
type JsonRow = { payload_json: string };
export const ADMIN_TAGIHAN_SCOPE = "admin";
export const ADMIN_PENDING_SCOPE = "admin";
const esc = (v: string) => v.replace(/[\\%_]/g, "\\$&");
const resource = (kind: "tagihan" | "pending", scope: string) =>
    `${kind}:${scope}`;
function warning(item: TagihanReminderItem): TagihanReminderItem {
    const status = item.status_tagihan;
    const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
    const days = Math.round(
        (Date.parse(item.tanggal_jatuh_tempo.slice(0, 10) + "T00:00:00Z") -
            Date.parse(today + "T00:00:00Z")) /
        86400000,
    );
    const inactive = status === "lunas" || status === "dibatalkan" || days > 7;
    const late = days < 0;
    return {
        ...item,
        peringatan: inactive
            ? {
                aktif: false,
                status: null,
                hari_tersisa: null,
                judul: null,
                pesan: null,
            }
            : {
                aktif: true,
                status: late ? "terlambat" : "akan_jatuh_tempo",
                hari_tersisa: days,
                judul: late ? "Tagihan Terlambat" : "Tagihan Akan Jatuh Tempo",
                pesan: late
                    ? `Tagihan terlambat ${Math.abs(days)} hari.`
                    : `Tagihan jatuh tempo dalam ${days} hari.`,
            },
    };
}
function parse<T>(rows: JsonRow[], map?: (v: T) => T): T[] {
    const out: T[] = [];
    for (const row of rows) {
        try {
            const value = JSON.parse(row.payload_json) as T;
            out.push(map ? map(value) : value);
        } catch {
            if (__DEV__) console.warn("Cache TAGIHAN berisi JSON tidak valid.");
        }
    }
    return out;
}
function filter(scope: string, search?: string, status?: AdminTagihanStatus) {
    const c = ["scope_key = ?"],
        v: string[] = [scope];
    if (status && status !== "semua") {
        c.push("status_tagihan = ?");
        v.push(status);
    }
    const q = search?.trim().slice(0, 100);
    if (q) {
        const x = `%${esc(q)}%`;
        c.push(
            "(kode_invoice LIKE ? ESCAPE '\\' COLLATE NOCASE OR penyewa_nama LIKE ? ESCAPE '\\' COLLATE NOCASE OR penyewa_email LIKE ? ESCAPE '\\' COLLATE NOCASE OR penyewa_no_hp LIKE ? ESCAPE '\\' COLLATE NOCASE OR nomor_kamar LIKE ? ESCAPE '\\' COLLATE NOCASE)",
        );
        v.push(x, x, x, x, x);
    }
    return { sql: `WHERE ${c.join(" AND ")}`, values: v };
}
export async function getLocalAdminTagihanPage(
    db: SQLiteDatabase,
    p: {
        page: number;
        per_page: number;
        search?: string;
        status: AdminTagihanStatus;
    },
): Promise<AdminTagihanListResponse> {
    const page = Math.max(1, p.page),
        pp = Math.max(1, p.per_page),
        off = (page - 1) * pp,
        f = filter(ADMIN_TAGIHAN_SCOPE, p.search, p.status);
    const [rows, count, summary] = await Promise.all([
        db.getAllAsync<JsonRow>(
            `SELECT payload_json FROM tagihan_cache ${f.sql} ORDER BY tanggal_jatuh_tempo DESC,id_tagihan DESC LIMIT ? OFFSET ?`,
            [...f.values, pp, off],
        ),
        db.getFirstAsync<CountRow>(
            `SELECT COUNT(*) count FROM tagihan_cache ${f.sql}`,
            f.values,
        ),
        db.getFirstAsync<AdminTagihanSummary>(
            `SELECT COUNT(*) total,COALESCE(SUM(status_tagihan='lunas'),0) lunas,COALESCE(SUM(status_tagihan IN ('belum_bayar','telat')),0) belum,COALESCE(SUM(status_tagihan='telat'),0) telat,COALESCE(SUM(status_tagihan='dibatalkan'),0) dibatalkan FROM tagihan_cache ${f.sql}`,
            f.values,
        ),
    ]);
    const data = parse<TagihanReminderItem>(rows, warning),
        total = count?.count ?? 0;
    return {
        data,
        meta: {
            current_page: page,
            per_page: pp,
            total,
            last_page: Math.max(1, Math.ceil(total / pp)),
            from: data.length ? off + 1 : null,
            to: data.length ? off + data.length : null,
        },
        summary: summary ?? {
            total: 0,
            lunas: 0,
            belum: 0,
            telat: 0,
            dibatalkan: 0,
        },
    };
}
export async function getLocalPenyewaTagihan(
    db: SQLiteDatabase,
    scope: string,
) {
    return parse<TagihanReminderItem>(
        await db.getAllAsync<JsonRow>(
            "SELECT payload_json FROM tagihan_cache WHERE scope_key=? ORDER BY tanggal_jatuh_tempo DESC,id_tagihan DESC",
            scope,
        ),
        warning,
    );
}
function pendingFilter(search?: string) {
    const c = ["scope_key = ?"],
        v = [ADMIN_PENDING_SCOPE];
    const q = search?.trim().slice(0, 100);
    if (q) {
        const x = `%${esc(q)}%`;
        c.push(
            "(metode_pembayaran LIKE ? ESCAPE '\\' COLLATE NOCASE OR kode_invoice LIKE ? ESCAPE '\\' COLLATE NOCASE OR penyewa_nama LIKE ? ESCAPE '\\' COLLATE NOCASE OR penyewa_email LIKE ? ESCAPE '\\' COLLATE NOCASE OR penyewa_no_hp LIKE ? ESCAPE '\\' COLLATE NOCASE OR nomor_kamar LIKE ? ESCAPE '\\' COLLATE NOCASE)",
        );
        v.push(x, x, x, x, x, x);
    }
    return { sql: `WHERE ${c.join(" AND ")}`, values: v };
}
export async function getLocalPendingPage(
    db: SQLiteDatabase,
    p: { page: number; per_page: number; search?: string },
): Promise<{ data: PendingPembayaranItem[]; meta: PaginationMeta }> {
    const page = Math.max(1, p.page),
        pp = Math.max(1, p.per_page),
        off = (page - 1) * pp,
        f = pendingFilter(p.search);
    const [rows, count] = await Promise.all([
        db.getAllAsync<JsonRow>(
            `SELECT payload_json FROM pending_pembayaran_cache ${f.sql} ORDER BY tanggal_bayar DESC,id_pembayaran DESC LIMIT ? OFFSET ?`,
            [...f.values, pp, off],
        ),
        db.getFirstAsync<CountRow>(
            `SELECT COUNT(*) count FROM pending_pembayaran_cache ${f.sql}`,
            f.values,
        ),
    ]);
    const data = parse<PendingPembayaranItem>(rows),
        total = count?.count ?? 0;
    return {
        data,
        meta: {
            current_page: page,
            per_page: pp,
            total,
            last_page: Math.max(1, Math.ceil(total / pp)),
            from: data.length ? off + 1 : null,
            to: data.length ? off + data.length : null,
        },
    };
}
export async function hasSnapshot(
    db: SQLiteDatabase,
    kind: "tagihan" | "pending",
    scope: string,
) {
    return Boolean((await getMetadata(db, kind, scope)).lastSyncedAt);
}
export async function getMetadata(
    db: SQLiteDatabase,
    kind: "tagihan" | "pending",
    scope: string,
) {
    const r = await db.getFirstAsync<MetaRow>(
        "SELECT last_synced_at,is_dirty FROM sync_metadata WHERE resource_name=?",
        resource(kind, scope),
    );
    return {
        lastSyncedAt: r?.last_synced_at || null,
        isDirty: r?.is_dirty === 1,
    };
}
export async function markDirty(
    db: SQLiteDatabase,
    kind: "tagihan" | "pending",
    scope: string,
) {
    await db.runAsync(
        "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,'',1) ON CONFLICT(resource_name) DO UPDATE SET is_dirty=1",
        resource(kind, scope),
    );
}
export async function clearStaging(
    db: SQLiteDatabase,
    kind: "tagihan" | "pending",
    scope: string,
) {
    await db.runAsync(
        `DELETE FROM ${kind === "tagihan" ? "tagihan_cache_staging" : "pending_pembayaran_cache_staging"} WHERE scope_key=?`,
        scope,
    );
}
export async function insertTagihanStaging(
    db: SQLiteDatabase,
    scope: string,
    items: TagihanReminderItem[],
) {
    await db.withExclusiveTransactionAsync(async (t) => {
        for (const i of items)
            await t.runAsync(
                "INSERT INTO tagihan_cache_staging VALUES(?,?,?,?,?,?,?,?,?,?)",
                scope,
                i.id_tagihan,
                i.status_tagihan,
                i.tanggal_jatuh_tempo,
                i.kode_invoice,
                i.penyewa?.nama_lengkap ?? null,
                i.penyewa?.email ?? null,
                i.penyewa?.no_hp ?? null,
                i.kamar?.nomor_kamar ?? null,
                JSON.stringify(i),
            );
    });
}
export async function insertPendingStaging(
    db: SQLiteDatabase,
    scope: string,
    items: PendingPembayaranItem[],
) {
    await db.withExclusiveTransactionAsync(async (t) => {
        for (const i of items)
            await t.runAsync(
                "INSERT INTO pending_pembayaran_cache_staging VALUES(?,?,?,?,?,?,?,?,?,?)",
                scope,
                i.id_pembayaran,
                i.tanggal_bayar,
                i.metode_pembayaran,
                i.tagihan?.kode_invoice ?? null,
                i.tagihan?.penyewa?.nama_lengkap ?? null,
                i.tagihan?.penyewa?.email ?? null,
                i.tagihan?.penyewa?.no_hp ?? null,
                i.tagihan?.kamar?.nomor_kamar ?? null,
                JSON.stringify(i),
            );
    });
}
export async function stagingCount(
    db: SQLiteDatabase,
    kind: "tagihan" | "pending",
    scope: string,
) {
    return (
        (
            await db.getFirstAsync<CountRow>(
                `SELECT COUNT(*) count FROM ${kind === "tagihan" ? "tagihan_cache_staging" : "pending_pembayaran_cache_staging"} WHERE scope_key=?`,
                scope,
            )
        )?.count ?? 0
    );
}
export async function publish(
    db: SQLiteDatabase,
    kind: "tagihan" | "pending",
    scope: string,
    count: number,
) {
    const live =
        kind === "tagihan" ? "tagihan_cache" : "pending_pembayaran_cache",
        stage = live + "_staging";
    await db.withExclusiveTransactionAsync(async (t) => {
        const n =
            (
                await t.getFirstAsync<CountRow>(
                    `SELECT COUNT(*) count FROM ${stage} WHERE scope_key=?`,
                    scope,
                )
            )?.count ?? 0;
        if (n !== count)
            throw new Error("Jumlah staging TAGIHAN berubah sebelum publikasi.");
        await t.runAsync(`DELETE FROM ${live} WHERE scope_key=?`, scope);
        await t.runAsync(
            `INSERT INTO ${live} SELECT * FROM ${stage} WHERE scope_key=?`,
            scope,
        );
        await t.runAsync(
            "INSERT INTO sync_metadata(resource_name,last_synced_at,is_dirty) VALUES(?,?,0) ON CONFLICT(resource_name) DO UPDATE SET last_synced_at=excluded.last_synced_at,is_dirty=0",
            resource(kind, scope),
            new Date().toISOString(),
        );
        await t.runAsync(`DELETE FROM ${stage} WHERE scope_key=?`, scope);
    });
}
