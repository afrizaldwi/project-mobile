import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import * as authService from "@/auth/authService";
import { getToken } from "@/auth/tokenStorage";
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

    const refreshUser = useCallback(async () => {
        setIsLoading(true);

        try {
            const token = await getToken();

            if (!token) {
                setUser(null);
                return;
            }

            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
            await authService.logout();
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (payload: LoginPayload) => {
        const loggedInUser = await authService.login(payload);

        setUser(loggedInUser);

        return loggedInUser;
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
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