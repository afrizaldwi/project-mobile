import { Stack } from "expo-router";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function PenyewaLayout() {
    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <AppLayout>
                <Stack screenOptions={{ headerShown: false }} />
            </AppLayout>
        </ProtectedRoute>
    );
}