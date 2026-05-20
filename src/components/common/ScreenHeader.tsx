import React, { ReactNode } from "react";
import { Text, View } from "react-native";

interface ScreenHeaderProps {
    title: string;
    subtitle: string;
    right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
    return (
        <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-1 pr-4">
                <Text className="text-3xl font-extrabold text-dark">{title}</Text>
                <Text className="text-sm text-gray-500">{subtitle}</Text>
            </View>
            {right}
        </View>
    );
}
