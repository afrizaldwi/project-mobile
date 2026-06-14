import type { AdminTagihanStatus } from "@/api/tagihanApi";
import type {
  AdminTagihanSummary,
  PendingPembayaranItem,
  TagihanReminderItem,
} from "@/types/tagihan";
import {
  ADMIN_PENDING_SCOPE,
  ADMIN_TAGIHAN_SCOPE,
  getLocalAdminTagihanPage,
  getLocalPendingPage,
  getMetadata,
  hasSnapshot,
} from "@/database/tagihanRepository";
import { syncAdminPending, syncAdminTagihan } from "@/database/tagihanSync";
import { getConnectivityStatus } from "@/network/connectivity";
import type { PaginationMeta } from "@/types/pagination";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
const PAGE = 20,
  FRESH = 300000;
const fresh = (v: string | null) =>
  v ? Date.now() - Date.parse(v) < FRESH : false;
const msg = (e: unknown, f: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || f;
function useLocal<T>(
  kind: "tagihan" | "pending",
  query: { search: string; status?: AdminTagihanStatus },
  getId: (item: T) => number,
  read: (p: number) => Promise<{
    data: T[];
    meta: PaginationMeta;
    summary?: AdminTagihanSummary;
  }>,
  sync: (force?: boolean) => Promise<void>,
) {
  const db = useSQLiteContext();
  const [items, setItems] = useState<T[]>([]),
    [meta, setMeta] = useState<PaginationMeta | null>(null),
    [summary, setSummary] = useState<AdminTagihanSummary | null>(null),
    [initialLoading, setInitial] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [loadingMore, setMore] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(false),
    focused = useRef(false),
    gen = useRef(0),
    more = useRef(false);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(
    async (soft = false) => {
      const g = ++gen.current;
      more.current = false;
      if (!soft) {
        setInitial(true);
        setItems([]);
        setMeta(null);
      }
      try {
        const r = await read(1);
        if (!mounted.current || g !== gen.current) return;
        setItems(r.data);
        setMeta(r.meta);
        if (r.summary) setSummary(r.summary);
        setError(null);
      } catch (e) {
        if (mounted.current && g === gen.current)
          setError(msg(e, "Gagal membaca cache TAGIHAN lokal."));
      } finally {
        if (mounted.current && g === gen.current) setInitial(false);
      }
    },
    [read],
  );
  const refresh = useCallback(
    async (force = false, show = false, usable = true) => {
      if (show) setRefreshing(true);
      try {
        if (!force) {
          const m = await getMetadata(
            db,
            kind,
            kind === "tagihan" ? ADMIN_TAGIHAN_SCOPE : ADMIN_PENDING_SCOPE,
          );
          if (usable && !m.isDirty && fresh(m.lastSyncedAt)) return;
        }
        if ((await getConnectivityStatus()) === "offline") {
          if (usable)
            setNotice(
              "Offline. Menampilkan data TAGIHAN yang tersimpan di perangkat.",
            );
          else
            setError(
              "Offline dan belum ada data TAGIHAN tersimpan di perangkat.",
            );
          return;
        }
        gen.current++;
        await sync(force);
        await load(true);
        setError(null);
        setNotice(null);
      } catch {
        if (usable)
          setNotice("Sinkronisasi TAGIHAN gagal. Cache lama tetap digunakan.");
        else
          setError(
            "Data TAGIHAN belum tersedia dan sinkronisasi tidak dapat diselesaikan.",
          );
      } finally {
        setRefreshing(false);
        setInitial(false);
      }
    },
    [db, kind, load, sync],
  );
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void (async () => {
        const s = await hasSnapshot(
          db,
          kind,
          kind === "tagihan" ? ADMIN_TAGIHAN_SCOPE : ADMIN_PENDING_SCOPE,
        );
        if (s) await load();
        await refresh(false, false, s);
      })();
      return () => {
        focused.current = false;
        gen.current++;
      };
    }, [db, kind, load, refresh]),
  );
  const loadMore = useCallback(async () => {
    if (
      initialLoading ||
      refreshing ||
      more.current ||
      !meta ||
      meta.current_page >= meta.last_page
    )
      return;
    more.current = true;
    setMore(true);
    const g = gen.current;
    try {
      const r = await read(meta.current_page + 1);
      if (g !== gen.current) return;
      setItems((c) => {
        const ids = new Set(c.map(getId));
        return [
          ...c,
          ...r.data.filter((x) => {
            const id = getId(x);
            if (ids.has(id)) return false;
            ids.add(id);
            return true;
          }),
        ];
      });
      setMeta(r.meta);
      setError(null);
    } catch {
      setError("Gagal memuat halaman berikutnya.");
    } finally {
      more.current = false;
      setMore(false);
    }
  }, [getId, initialLoading, meta, read, refreshing]);
  return {
    items,
    meta,
    summary,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    notice,
    refresh: () => void refresh(true, true, Boolean(meta)),
    reload: () => refresh(true, false, Boolean(meta)),
    loadMore,
    retry: () => void refresh(true, false, Boolean(meta)),
  };
}
export function useAdminTagihanList() {
  const db = useSQLiteContext();
  const [status, setStatus] = useState<AdminTagihanStatus>("semua"),
    [search, setSearchRaw] = useState(""),
    [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const read = useCallback(
    (page: number) =>
      getLocalAdminTagihanPage(db, {
        page,
        per_page: PAGE,
        search: q || undefined,
        status,
      }),
    [db, q, status],
  );
  const sync = useCallback(
    (force = false) => syncAdminTagihan(db, force),
    [db],
  );
  return {
    ...useLocal<TagihanReminderItem>(
      "tagihan",
      { search: q, status },
      (item) => item.id_tagihan,
      read,
      sync,
    ),
    status,
    setStatus,
    search,
    setSearch: (v: string) => setSearchRaw(v.slice(0, 100)),
  };
}
export function useAdminPendingPayments() {
  const db = useSQLiteContext();
  const [search, setSearchRaw] = useState(""),
    [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const read = useCallback(
    (page: number) =>
      getLocalPendingPage(db, { page, per_page: PAGE, search: q || undefined }),
    [db, q],
  );
  const sync = useCallback(
    (force = false) => syncAdminPending(db, force),
    [db],
  );
  return {
    ...useLocal<PendingPembayaranItem>(
      "pending",
      { search: q },
      (item) => item.id_pembayaran,
      read,
      sync,
    ),
    search,
    setSearch: (v: string) => setSearchRaw(v.slice(0, 100)),
  };
}
