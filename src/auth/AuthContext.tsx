import { router } from "expo-router";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { Alert } from "react-native";

import { setAuthSessionInactiveHandler } from "@/api/client";
import * as authService from "@/auth/authService";
import { clearAuthStorage, getCachedUser, getToken } from "@/auth/tokenStorage";
import { NotificationFacade } from "@/services/NotificationFacade";
import type { LoginPayload, User } from "@/types";

type AuthContextValue = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<User>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

type AuthProviderProps = {
    children: ReactNode;
};

function getHttpStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } }).response?.status;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sessionAlertVisibleRef = useRef(false);
    const initialRestoreCompletedRef = useRef(false);
    const initialRestoreStartedRef = useRef(false);
    const activeUserRef = useRef<User | null>(null);

    const updateUser = useCallback((nextUser: User | null) => {
        activeUserRef.current = nextUser;
        setUser(nextUser);
    }, []);

    const resetRuntimeSession = useCallback(() => {
        NotificationFacade.resetNotifiedNotifications();
        updateUser(null);
    }, [updateUser]);

    useEffect(() => {
        setAuthSessionInactiveHandler((message) => {
            const hadActiveUser = activeUserRef.current !== null;

            resetRuntimeSession();

            if (!initialRestoreCompletedRef.current || !hadActiveUser) {
                return;
            }

            router.replace("/login");

            if (sessionAlertVisibleRef.current) return;

            sessionAlertVisibleRef.current = true;
            Alert.alert("Sesi Tidak Aktif", message, [
                {
                    text: "OK",
                    onPress: () => {
                        sessionAlertVisibleRef.current = false;
                    },
                },
            ]);
        });

        return () => setAuthSessionInactiveHandler(null);
    }, [resetRuntimeSession]);

    const refreshUser = useCallback(async () => {
        setIsLoading(true);

        try {
            const token = await getToken();

            if (!token) {
                resetRuntimeSession();
                return;
            }

            const currentUser = await authService.getCurrentUser();
            updateUser(currentUser);
        } catch (error) {
            const status = getHttpStatus(error);
            if (status === 401 || status === 403) {
                await clearAuthStorage();
                resetRuntimeSession();
                return;
            }

            updateUser(await getCachedUser());
        } finally {
            initialRestoreCompletedRef.current = true;
            setIsLoading(false);
        }
    }, [resetRuntimeSession, updateUser]);

    const login = useCallback(async (payload: LoginPayload) => {
        const loggedInUser = await authService.login(payload);

        updateUser(loggedInUser);
        void NotificationFacade.checkAndNotifyForUser(loggedInUser.id).catch((error) => {
            if (__DEV__) {
                console.warn("[AuthContext] Gagal menjalankan cek notifikasi setelah login:", error);
            }
        });

        return loggedInUser;
    }, [updateUser]);

    const logout = useCallback(async () => {
        await authService.logout();
        resetRuntimeSession();
    }, [resetRuntimeSession]);

    useEffect(() => {
        if (initialRestoreStartedRef.current) {
            return;
        }

        initialRestoreStartedRef.current = true;
        void refreshUser();
    }, [refreshUser]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            isLoading,
            login,
            logout,
            refreshUser,
        }),
        [user, isLoading, login, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
