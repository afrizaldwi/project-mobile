import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/auth/AuthContext";
import { getCachedUser } from "@/auth/tokenStorage";
import {
    getCachedProfile,
    getProfileSyncMetadata,
    hasCachedProfileSnapshot,
    markProfileCacheDirty,
} from "@/database/profileRepository";
import { buildProfileScope } from "@/database/profileScope";
import { synchronizeProfile } from "@/database/profileSync";
import { getConnectivityStatus } from "@/network/connectivity";
import { getApiErrorMessage } from "@/utils/apiErrors";
import type { UserRole } from "@/types";
import type { ProfileUser } from "@/types/profile";

const CACHE_FRESHNESS_MS = 5 * 60 * 1000;

const isFresh = (lastSyncedAt: string | null) =>
    lastSyncedAt ? Date.now() - Date.parse(lastSyncedAt) < CACHE_FRESHNESS_MS : false;

function buildPartialProfile(
    user: { id: number; nama_lengkap: string; email: string; role: UserRole } | null,
): ProfileUser | null {
    if (!user) return null;
    return {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role,
        no_hp: null,
        foto_profil: null,
        alamat_asal: null,
        created_at: null,
        updated_at: null,
        status_sewa: null,
        sewa: null,
        kamar: null,
    };
}

export function useProfile(expectedRole: UserRole) {
    const db = useSQLiteContext();
    const { user } = useAuth();
    const scope =
        user && user.role === expectedRole ? buildProfileScope(user.role, user.id) : null;
    const [profile, setProfile] = useState<ProfileUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPartial, setIsPartial] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [dataScope, setDataScope] = useState<string | null>(null);
    const mountedRef = useRef(false);
    const focusedRef = useRef(false);
    const generationRef = useRef(0);

    const applyProfile = useCallback(
        (
            nextProfile: ProfileUser | null,
            nextScope: string | null,
            partial: boolean,
        ) => {
            setProfile(nextProfile);
            setDataScope(nextScope);
            setIsPartial(partial);
        },
        [],
    );

    const loadLocal = useCallback(
        async (targetScope: string, generation: number) => {
            try {
                const local = await getCachedProfile(db, targetScope);
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return false;
                if (!local) {
                    await markProfileCacheDirty(db, targetScope).catch(() => undefined);
                    return false;
                }
                applyProfile(local, targetScope, false);
                setError(null);
                return true;
            } catch (loadError) {
                if (__DEV__) {
                    const message =
                        loadError instanceof Error ? loadError.message : "Unknown error";
                    console.warn("[PROFILE CACHE] Invalid cached profile", {
                        scope: targetScope,
                        message,
                    });
                }
                await markProfileCacheDirty(db, targetScope).catch(() => undefined);
                if (
                    mountedRef.current &&
                    focusedRef.current &&
                    generation === generationRef.current
                ) {
                    setError(null);
                }
                return false;
            }
        },
        [applyProfile, db],
    );

    const loadPartialFallback = useCallback(
        async (generation: number) => {
            const cachedUser = await getCachedUser();
            if (
                !mountedRef.current ||
                !focusedRef.current ||
                generation !== generationRef.current
            )
                return false;
            if (
                !cachedUser ||
                !user ||
                cachedUser.id !== user.id ||
                cachedUser.role !== user.role
            )
                return false;
            applyProfile(buildPartialProfile(cachedUser), scope, true);
            return true;
        },
        [applyProfile, scope, user],
    );

    const syncAndReload = useCallback(
        async (
            targetScope: string,
            force: boolean,
            showRefresh = false,
            hasFullSnapshot = true,
            hasPartialFallback = false,
        ) => {
            const generation = generationRef.current;
            if (mountedRef.current && showRefresh) setRefreshing(true);
            try {
                if (!force) {
                    const metadata = await getProfileSyncMetadata(db, targetScope);
                    if (hasFullSnapshot && !metadata.isDirty && isFresh(metadata.lastSyncedAt))
                        return;
                }
                const status = await getConnectivityStatus();
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                setIsOffline(status === "offline");
                if (status === "offline") {
                    if (hasFullSnapshot) {
                        setNotice("Offline. Menampilkan profil yang tersimpan di perangkat.");
                        setError(null);
                    } else if (hasPartialFallback) {
                        setNotice(
                            "Menampilkan informasi akun dasar. Profil lengkap belum tersimpan di perangkat.",
                        );
                        setError(null);
                    } else {
                        setNotice(null);
                        setError("Profil tidak tersedia saat offline.");
                    }
                    return;
                }
                await synchronizeProfile(db, targetScope, expectedRole, force);
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                const loaded = await loadLocal(targetScope, generation);
                if (!loaded)
                    throw new Error("Profil lokal tidak tersedia setelah sinkronisasi.");
                setNotice(null);
                setError(null);
            } catch (syncError) {
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                if (hasFullSnapshot || hasPartialFallback) {
                    setError(null);
                    setNotice("Sinkronisasi profil gagal. Data tersimpan tetap digunakan.");
                } else {
                    setNotice(null);
                    setError(
                        getApiErrorMessage(syncError, "Profil belum tersedia dan sinkronisasi gagal."),
                    );
                }
            } finally {
                if (
                    mountedRef.current &&
                    focusedRef.current &&
                    generation === generationRef.current
                ) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [db, expectedRole, loadLocal],
    );

    useFocusEffect(
        useCallback(() => {
            mountedRef.current = true;
            focusedRef.current = true;
            generationRef.current += 1;
            const generation = generationRef.current;
            applyProfile(null, null, false);
            setLoading(true);
            setRefreshing(false);
            setNotice(null);
            setError(null);
            setIsOffline(false);

            if (!user) {
                setLoading(false);
                setError("Tidak ada sesi pengguna aktif.");
                return () => {
                    focusedRef.current = false;
                    generationRef.current += 1;
                };
            }
            if (user.role !== expectedRole) {
                setLoading(false);
                setError("Role akun tidak sesuai dengan halaman profil ini.");
                return () => {
                    focusedRef.current = false;
                    generationRef.current += 1;
                };
            }
            if (!scope) {
                setLoading(false);
                return () => {
                    focusedRef.current = false;
                    generationRef.current += 1;
                };
            }

            void (async () => {
                const hasSnapshot = await hasCachedProfileSnapshot(db, scope);
                if (
                    !mountedRef.current ||
                    !focusedRef.current ||
                    generation !== generationRef.current
                )
                    return;
                let fullLoaded = false;
                if (hasSnapshot) {
                    fullLoaded = await loadLocal(scope, generation);
                    if (
                        mountedRef.current &&
                        focusedRef.current &&
                        generation === generationRef.current &&
                        fullLoaded
                    )
                        setLoading(false);
                }
                let partialLoaded = false;
                if (!fullLoaded) {
                    partialLoaded = await loadPartialFallback(generation);
                    if (
                        mountedRef.current &&
                        focusedRef.current &&
                        generation === generationRef.current &&
                        partialLoaded
                    )
                        setLoading(false);
                }
                await syncAndReload(scope, false, false, fullLoaded, partialLoaded);
            })().catch((focusError) => {
                if (
                    mountedRef.current &&
                    focusedRef.current &&
                    generation === generationRef.current
                ) {
                    setError(getApiErrorMessage(focusError, "Gagal menyiapkan profil."));
                    setLoading(false);
                }
            });

            return () => {
                focusedRef.current = false;
                generationRef.current += 1;
            };
        }, [
            applyProfile,
            db,
            expectedRole,
            loadLocal,
            loadPartialFallback,
            scope,
            syncAndReload,
            user,
        ]),
    );

    return {
        profile: dataScope === scope ? profile : null,
        loading,
        refreshing,
        notice,
        error,
        isPartial: dataScope === scope ? isPartial : false,
        isOffline,
        refresh: () => {
            if (!scope) return;
            void syncAndReload(
                scope,
                true,
                true,
                dataScope === scope && !isPartial,
                dataScope === scope && isPartial,
            );
        },
    };
}
