import { Text, View } from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminDashboardScreen() {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 justify-center bg-secondary px-6">
                <Text className="mb-2 text-3xl font-extrabold text-dark">
                    Admin Dashboard
                </Text>
            </View>
        </ProtectedRoute>
    );
}