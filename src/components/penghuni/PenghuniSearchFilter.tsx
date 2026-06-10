import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { PenghuniFilterStatus } from "@/hooks/usePenghuni";

const FILTER_OPTIONS: { status: PenghuniFilterStatus; label: string }[] = [
    { status: "AKTIF", label: "Aktif" },
    { status: "SELESAI", label: "Selesai" },
    { status: "SEMUA", label: "Semua" },
];

interface PenghuniSearchFilterProps {
    activeTab: PenghuniFilterStatus;
    setActiveTab: (tab: PenghuniFilterStatus) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const PenghuniSearchFilter: React.FC<PenghuniSearchFilterProps> = ({
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
}) => {
    return (
        <View className="px-6 py-4">
            <View className="bg-white rounded-xl p-2 flex-row items-center justify-between border border-gray-100 shadow-sm">
                {/* Tabs */}
                <View className="w-full gap-2 items-center">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full">
                        {FILTER_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.status}
                                onPress={() => setActiveTab(option.status)}
                                className="mr-2 rounded-md px-4 py-2"
                                style={{ backgroundColor: activeTab === option.status ? "#2563eb" : "transparent" }}
                            >
                                <Text
                                    className="font-medium text-center"
                                    style={{ color: activeTab === option.status ? "white" : "#6b7280" }}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Search Bar */}
                    <View className="flex-row items-center rounded-lg py-1 bg-gray-50">
                        <TextInput
                            placeholder="Cari nama atau kamar..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="ml-2 flex-1 text-sm text-dark"
                            placeholderTextColor="#9ca3af"
                            maxLength={100}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};
