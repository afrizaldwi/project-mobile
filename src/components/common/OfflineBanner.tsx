import { Text, View } from "react-native";

import { useOfflineGuard } from "@/hooks/useOfflineGuard";

export function OfflineBanner() {
    const isOffline = useOfflineGuard();

    if (!isOffline) {
        return null;
    }

    return (
        <View className="border-l-4 border-warning bg-light px-4 py-3">
            <View className="flex-row items-start gap-3">
                <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-warning" />
                <View className="flex-1">
                    <Text className="font-bold text-dark">Mode Offline</Text>
                    <Text className="mt-0.5 text-xs leading-5 text-dark">
                        Data tersimpan tetap dapat dilihat, tetapi perubahan memerlukan koneksi internet.
                    </Text>
                </View>
            </View>
        </View>
    );
}
