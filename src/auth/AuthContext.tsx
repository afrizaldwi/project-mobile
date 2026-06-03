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
import { getToken } from "@/auth/tokenStorage";
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sessionAlertVisibleRef = useRef(false);

    useEffect(() => {
        setAuthSessionInactiveHandler((message) => {
            NotificationFacade.resetNotifiedNotifications();
            setUser(null);
            setIsLoading(false);
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
    }, []);

    const refreshUser = useCallback(async () => {
        setIsLoading(true);

        try {
            const token = await getToken();

            if (!token) {
                setUser(null);
                NotificationFacade.resetNotifiedNotifications();
                return;
            }

            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
            NotificationFacade.resetNotifiedNotifications();
            await authService.logout();
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (payload: LoginPayload) => {
        const loggedInUser = await authService.login(payload);

        setUser(loggedInUser);
        void NotificationFacade.checkAndNotifyForUser(loggedInUser.id).catch((error) => {
            if (__DEV__) {
                console.warn("[AuthContext] Gagal menjalankan cek notifikasi setelah login:", error);
            }
        });

        return loggedInUser;
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        NotificationFacade.resetNotifiedNotifications();
        setUser(null);
    }, []);

    useEffect(() => {
        refreshUser();
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
