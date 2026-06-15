import { ActivityIndicator, Text, View } from "react-native";

export function DashboardLoading() {
    return (
        <View className="flex-1 items-center justify-center bg-light">
            <ActivityIndicator size="large" color="#2563eb" />

            <Text className="mt-3 text-sm font-semibold text-dark/50">
                Memuat dashboard...
            </Text>
        </View>
    );
}