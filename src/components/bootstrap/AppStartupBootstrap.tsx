import { useAuth } from "@/auth/AuthContext";
import { readDashboardSnapshot } from "@/database/dashboardRepository";
import {
    buildStartupPreloadTasks,
    runBoundedStartupTasks,
} from "@/services/startupPreload";
import { hideNativeSplash, hasNativeSplashBeenHidden } from "@/utils/nativeSplash";
import { getConnectivityStatus, type ConnectivityStatus } from "@/network/connectivity";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef } from "react";

const SPLASH_PRELOAD_WINDOW_MS = 1500;

function delay(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function AppStartupBootstrap() {
    const db = useSQLiteContext();
    const { user, isLoading } = useAuth();
    const authGenerationRef = useRef(0);
    const activeSessionKeyRef = useRef<string | null>(null);
    const startedSessionKeyRef = useRef<string | null>(null);

    useEffect(() => {
        if (isLoading) return;

        const sessionKey =
            user &&
            Number.isInteger(user.id) &&
            user.id > 0 &&
            (user.role === "admin" || user.role === "penyewa")
                ? `${user.role}:${user.id}`
                : null;

        if (
            !sessionKey ||
            !user
        ) {
            if (__DEV__) {
                console.debug("[STARTUP PRELOAD] Unauthenticated preload skipped");
            }
            if (
                activeSessionKeyRef.current !== null ||
                startedSessionKeyRef.current !== null
            ) {
                authGenerationRef.current += 1;
                activeSessionKeyRef.current = null;
                startedSessionKeyRef.current = null;
                if (__DEV__) {
                    console.debug("[STARTUP PRELOAD] Session guard reset on logout");
                }
            }
            void hideNativeSplash("no-auth-session");
            return;
        }

        if (activeSessionKeyRef.current !== sessionKey) {
            authGenerationRef.current += 1;
            activeSessionKeyRef.current = sessionKey;
            startedSessionKeyRef.current = null;
            if (__DEV__) {
                console.debug("[STARTUP PRELOAD] Authenticated session detected", {
                    role: user.role,
                    scope: sessionKey,
                });
            }
        }

        if (startedSessionKeyRef.current === sessionKey) {
            if (__DEV__) {
                console.debug("[STARTUP PRELOAD] Same-session preload already started", {
                    role: user.role,
                    scope: sessionKey,
                });
            }
            return;
        }

        startedSessionKeyRef.current = sessionKey;
        const generation = authGenerationRef.current;

        void (async () => {
            const startedAt = Date.now();
            let shouldHoldSplash = !hasNativeSplashBeenHidden();

            if (shouldHoldSplash) {
                const dashboardScope =
                    user.role === "admin" ? "admin" : sessionKey;

                try {
                    await readDashboardSnapshot(db, dashboardScope);
                    shouldHoldSplash = false;
                } catch {
                    shouldHoldSplash = true;
                }
            }
            let connectivity: ConnectivityStatus = "unknown";
            if (__DEV__) {
                console.debug("[STARTUP PRELOAD] Preload started", {
                    role: user.role,
                    scope: sessionKey,
                    holdSplash: shouldHoldSplash,
                });
            }

            try {
                try {
                    connectivity = await getConnectivityStatus();
                } catch (error) {
                    if (__DEV__) {
                        const message =
                            error instanceof Error ? error.message : "Unknown error";
                        console.warn("[STARTUP PRELOAD] Connectivity check failed", {
                            role: user.role,
                            scope: sessionKey,
                            outcome: "failure",
                            message,
                        });
                    }
                }

                if (connectivity === "offline") {
                    if (__DEV__) {
                        console.debug("[STARTUP PRELOAD] Skipped while offline", {
                            role: user.role,
                            scope: sessionKey,
                            outcome: "skipped",
                        });
                    }
                    await hideNativeSplash("offline-startup");
                    return;
                }

                const plan = await buildStartupPreloadTasks(db, user);
                if (!plan || plan.tasks.length === 0) {
                    await hideNativeSplash("no-preload-tasks");
                    return;
                }

                const runner = runBoundedStartupTasks(plan.tasks, {
                    role: plan.role,
                    scope: plan.scope,
                });
                const completionLog = runner.then((results) => {
                    if (__DEV__) {
                        const failed = results.filter(
                            (result) => result?.status === "rejected",
                        ).length;
                        console.debug("[STARTUP PRELOAD] Completed", {
                            role: user.role,
                            scope: sessionKey,
                            durationMs: Date.now() - startedAt,
                            outcome: failed > 0 ? "partial" : "success",
                            totalModules: results.length,
                            failedModules: failed,
                        });
                    }
                });

                if (connectivity === "online" && shouldHoldSplash) {
                    await Promise.race([runner, delay(SPLASH_PRELOAD_WINDOW_MS)]);
                    await hideNativeSplash("bounded-preload-window");
                } else {
                    await hideNativeSplash(
                        connectivity === "unknown"
                            ? "unknown-connectivity-continue-background"
                            : "background-preload",
                    );
                }

                void completionLog;
            } catch (error) {
                if (__DEV__) {
                    const message =
                        error instanceof Error ? error.message : "Unknown error";
                    console.warn("[STARTUP PRELOAD] Orchestration failed", {
                        role: user.role,
                        scope: sessionKey,
                        outcome: "failure",
                        message,
                        durationMs: Date.now() - startedAt,
                    });
                }
                await hideNativeSplash("preload-failed");
            } finally {
                if (generation !== authGenerationRef.current) return;
            }
        })();
    }, [db, isLoading, user]);

    return null;
}
