import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import type { UserRole } from "@/types";

type ProtectedRouteProps = {
    children: ReactNode;
    allowedRoles?: UserRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Redirect href="/" />;
    }

    return children;
}