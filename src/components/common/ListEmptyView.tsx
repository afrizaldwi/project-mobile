import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface ListEmptyViewProps {
    icon: keyof typeof Ionicons.glyphMap;
    message: string;
}

export function ListEmptyView({ icon, message }: ListEmptyViewProps) {
    return (
        <View className="mt-10 items-center justify-center">
            <Ionicons name={icon} size={64} color="#9ca3af" />
            <Text className="mt-4 text-center text-gray-500">{message}</Text>
        </View>
    );
}
