import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";

type DashboardSectionProps = PropsWithChildren<{
    title: string;
}>;

export function DashboardSection({
    title,
    children,
}: DashboardSectionProps) {
    return (
        <View className="mt-5 rounded-3xl border border-gray-100 bg-white p-5">
            <Text className="mb-4 text-lg font-black text-dark">
                {title}
            </Text>

            {children}
        </View>
    );
}