import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  tagihanApi,
  type AdminTagihanStatus,
  type AdminTagihanSummary,
  type PendingPembayaranItem,
  type TagihanReminderItem,
} from "@/api/tagihanApi";
import type { PaginationMeta } from "@/types/pagination";

type FirstPageMode = "initial" | "refresh";
const PAGE_SIZE = 20;

function getErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error instanceof Error ? error.message : null) ||
    fallback
  );
}

export function useAdminTagihanList() {
  const [items, setItems] = useState<TagihanReminderItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AdminTagihanSummary | null>(null);
  const [status, setStatusState] = useState<AdminTagihanStatus>("semua");
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState({ value: "", revision: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);
  const requestedPageRef = useRef<number | null>(null);
  const failedModeRef = useRef<FirstPageMode | "loadMore" | null>(null);
  const initialSearchRef = useRef(true);

  useEffect(() => {
    if (initialSearchRef.current) {
      initialSearchRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setDebouncedSearch((current) => ({ value: search.trim(), revision: current.revision + 1 }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchFirstPage = useCallback(async (mode: FirstPageMode = "initial") => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadingMoreRef.current = false;
    requestedPageRef.current = null;
    failedModeRef.current = null;
    setLoadingMore(false);
    setError(null);

    if (mode === "refresh") setRefreshing(true);
    else {
      setInitialLoading(true);
      setItems([]);
      setMeta(null);
      setSummary(null);
    }

    try {
      const response = await tagihanApi.getAdminTagihan({
        page: 1,
        per_page: PAGE_SIZE,
        search: debouncedSearch.value || undefined,
        status,
      }, controller.signal);
      if (generation !== generationRef.current) return;
      setItems(response.data);
      setMeta(response.meta);
      setSummary(response.summary);
    } catch (requestError) {
      if (controller.signal.aborted || generation !== generationRef.current) return;
      setError(getErrorMessage(requestError, "Gagal memuat data tagihan."));
      failedModeRef.current = mode;
    } finally {
      if (generation === generationRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, status]);

  useFocusEffect(useCallback(() => {
    void fetchFirstPage("initial");
    return () => {
      generationRef.current += 1;
      controllerRef.current?.abort();
      loadingMoreRef.current = false;
      requestedPageRef.current = null;
    };
  }, [fetchFirstPage]));

  const loadMore = useCallback(async () => {
    if (initialLoading || refreshing || loadingMoreRef.current || items.length === 0 || !meta || meta.current_page >= meta.last_page) return;
    const nextPage = meta.current_page + 1;
    if (requestedPageRef.current === nextPage) return;
    loadingMoreRef.current = true;
    requestedPageRef.current = nextPage;
    failedModeRef.current = null;
    setLoadingMore(true);
    setError(null);

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await tagihanApi.getAdminTagihan({
        page: nextPage,
        per_page: PAGE_SIZE,
        search: debouncedSearch.value || undefined,
        status,
      }, controller.signal);
      if (generation !== generationRef.current) return;
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id_tagihan));
        const newItems = response.data.filter((item) => {
          if (ids.has(item.id_tagihan)) return false;
          ids.add(item.id_tagihan);
          return true;
        });
        return [...current, ...newItems];
      });
      setMeta(response.meta);
    } catch (requestError) {
      if (controller.signal.aborted || generation !== generationRef.current) return;
      requestedPageRef.current = null;
      setError(getErrorMessage(requestError, "Gagal memuat tagihan berikutnya."));
      failedModeRef.current = "loadMore";
    } finally {
      if (generation === generationRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, initialLoading, items.length, meta, refreshing, status]);

  const resetQuery = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    loadingMoreRef.current = false;
    requestedPageRef.current = null;
    setLoadingMore(false);
    setRefreshing(false);
    setInitialLoading(true);
    setItems([]);
    setMeta(null);
    setSummary(null);
    setError(null);
  }, []);

  const setSearch = useCallback((value: string) => {
    const next = value.slice(0, 100);
    if (next === search) return;
    resetQuery();
    setSearchState(next);
  }, [resetQuery, search]);

  const setStatus = useCallback((value: AdminTagihanStatus) => {
    if (value === status) return;
    resetQuery();
    setStatusState(value);
  }, [resetQuery, status]);

  const retry = useCallback(() => {
    if (failedModeRef.current === "loadMore") void loadMore();
    else void fetchFirstPage(failedModeRef.current === "refresh" ? "refresh" : "initial");
  }, [fetchFirstPage, loadMore]);

  return { items, meta, summary, status, setStatus, search, setSearch, initialLoading, refreshing, loadingMore, error, refresh: () => void fetchFirstPage("refresh"), reload: () => fetchFirstPage("initial"), loadMore, retry };
}

export function useAdminPendingPayments() {
  const [items, setItems] = useState<PendingPembayaranItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState({ value: "", revision: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generationRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);
  const requestedPageRef = useRef<number | null>(null);
  const failedModeRef = useRef<FirstPageMode | "loadMore" | null>(null);
  const initialSearchRef = useRef(true);

  useEffect(() => {
    if (initialSearchRef.current) {
      initialSearchRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setDebouncedSearch((current) => ({ value: search.trim(), revision: current.revision + 1 }));
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchFirstPage = useCallback(async (mode: FirstPageMode = "initial") => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    loadingMoreRef.current = false;
    requestedPageRef.current = null;
    failedModeRef.current = null;
    setLoadingMore(false);
    setError(null);
    if (mode === "refresh") setRefreshing(true);
    else {
      setInitialLoading(true);
      setItems([]);
      setMeta(null);
    }
    try {
      const response = await tagihanApi.getPendingPayments({ page: 1, per_page: PAGE_SIZE, search: debouncedSearch.value || undefined }, controller.signal);
      if (generation !== generationRef.current) return;
      setItems(response.data);
      setMeta(response.meta);
    } catch (requestError) {
      if (controller.signal.aborted || generation !== generationRef.current) return;
      setError(getErrorMessage(requestError, "Gagal memuat pembayaran pending."));
      failedModeRef.current = mode;
    } finally {
      if (generation === generationRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch]);

  useFocusEffect(useCallback(() => {
    void fetchFirstPage("initial");
    return () => {
      generationRef.current += 1;
      controllerRef.current?.abort();
      loadingMoreRef.current = false;
      requestedPageRef.current = null;
    };
  }, [fetchFirstPage]));

  const loadMore = useCallback(async () => {
    if (initialLoading || refreshing || loadingMoreRef.current || items.length === 0 || !meta || meta.current_page >= meta.last_page) return;
    const nextPage = meta.current_page + 1;
    if (requestedPageRef.current === nextPage) return;
    loadingMoreRef.current = true;
    requestedPageRef.current = nextPage;
    failedModeRef.current = null;
    setLoadingMore(true);
    setError(null);
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await tagihanApi.getPendingPayments({ page: nextPage, per_page: PAGE_SIZE, search: debouncedSearch.value || undefined }, controller.signal);
      if (generation !== generationRef.current) return;
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id_pembayaran));
        const newItems = response.data.filter((item) => {
          if (ids.has(item.id_pembayaran)) return false;
          ids.add(item.id_pembayaran);
          return true;
        });
        return [...current, ...newItems];
      });
      setMeta(response.meta);
    } catch (requestError) {
      if (controller.signal.aborted || generation !== generationRef.current) return;
      requestedPageRef.current = null;
      setError(getErrorMessage(requestError, "Gagal memuat pembayaran pending berikutnya."));
      failedModeRef.current = "loadMore";
    } finally {
      if (generation === generationRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, initialLoading, items.length, meta, refreshing]);

  const resetSearch = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    loadingMoreRef.current = false;
    requestedPageRef.current = null;
    setLoadingMore(false);
    setRefreshing(false);
    setInitialLoading(true);
    setItems([]);
    setMeta(null);
    setError(null);
  }, []);

  const setSearch = useCallback((value: string) => {
    const next = value.slice(0, 100);
    if (next === search) return;
    resetSearch();
    setSearchState(next);
  }, [resetSearch, search]);

  const retry = useCallback(() => {
    if (failedModeRef.current === "loadMore") void loadMore();
    else void fetchFirstPage(failedModeRef.current === "refresh" ? "refresh" : "initial");
  }, [fetchFirstPage, loadMore]);

  return { items, meta, search, setSearch, initialLoading, refreshing, loadingMore, error, refresh: () => void fetchFirstPage("refresh"), reload: () => fetchFirstPage("initial"), loadMore, retry };
}
