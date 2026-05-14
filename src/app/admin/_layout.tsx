import { Stack } from "expo-router";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminLayout() {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout>
                <Stack screenOptions={{ headerShown: false }} />
            </AppLayout>
        </ProtectedRoute>
    );
}