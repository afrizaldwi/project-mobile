import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { KeluhanFilterStatus } from "@/hooks/admin/useAdminKeluhans";

const FILTER_OPTIONS: { status: KeluhanFilterStatus; label: string }[] = [
    { status: "semua", label: "Semua" },
    { status: "pending", label: "Pending" },
    { status: "proses", label: "Proses" },
    { status: "selesai", label: "Selesai" },
];

interface KeluhanStatusFilterProps {
    filter: KeluhanFilterStatus;
    onFilterChange: (status: KeluhanFilterStatus) => void;
}

function FilterChip({
    label,
    isActive,
    onPress,
}: {
    label: string;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`mr-2 rounded-full px-4 py-2 ${
                isActive ? "bg-primary" : "border border-gray-200 bg-white"
            }`}
        >
            <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-600"}`}>
                {label}
            </Text>
        </Pressable>
    );
}

export function KeluhanStatusFilter({ filter, onFilterChange }: KeluhanStatusFilterProps) {
    return (
        <View className="px-6 pb-2">
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={FILTER_OPTIONS}
                keyExtractor={(item) => item.status}
                renderItem={({ item }) => (
                    <FilterChip
                        label={item.label}
                        isActive={filter === item.status}
                        onPress={() => onFilterChange(item.status)}
                    />
                )}
            />
        </View>
    );
}
