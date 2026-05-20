import React from "react";
import { View, Text } from "react-native";

export type StatCardProps = {
    icon: string;
    label: string;
    value: string;
    bgColor: string;
};

export function StatCard({ icon, label, value, bgColor }: StatCardProps) {
    return (
        <View className="flex-1 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
            <View
                className="mb-2 h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: bgColor }}
            >
                <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <Text className="text-xl font-black text-dark">{value}</Text>
            <Text className="text-xs font-bold text-dark/40 mt-0.5">{label}</Text>
        </View>
    );
}
