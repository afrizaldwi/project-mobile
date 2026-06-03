import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface PenghuniSearchFilterProps {
    activeTab: "AKTIF" | "NON AKTIF";
    setActiveTab: (tab: "AKTIF" | "NON AKTIF") => void;
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
                    <View className="flex-row gap-4 justify-between w-full rounded-lg p-1">
                        <TouchableOpacity
                            onPress={() => setActiveTab("AKTIF")}
                            className="px-4 py-2 rounded-md w-1/2"
                            style={{
                                backgroundColor: activeTab === "AKTIF" ? "#2563eb" : "transparent"
                            }}
                        >
                            <Text
                                className="font-medium text-center"
                                style={{
                                    color: activeTab === "AKTIF" ? "white" : "#6b7280"
                                }}
                            >
                                Penghuni Aktif
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab("NON AKTIF")}
                            className="px-4 py-2 rounded-md w-1/2"
                            style={{
                                backgroundColor: activeTab === "NON AKTIF" ? "#2563eb" : "transparent"
                            }}
                        >
                            <Text
                                className="font-medium text-center"
                                style={{
                                    color: activeTab === "NON AKTIF" ? "white" : "#6b7280"
                                }}
                            >
                                Riwayat / Alumni
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View className="flex-row items-center rounded-lg py-1 bg-gray-50">
                        <TextInput
                            placeholder="Cari nama atau kamar..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="ml-2 flex-1 text-sm text-dark"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};
