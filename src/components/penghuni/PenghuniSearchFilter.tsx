import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
                <View className="flex-row bg-gray-50 rounded-lg p-1">
                    <TouchableOpacity
                        onPress={() => setActiveTab("AKTIF")}
                        className="px-4 py-2 rounded-md"
                        style={{
                            backgroundColor: activeTab === "AKTIF" ? "#2563eb" : "transparent"
                        }}
                    >
                        <Text
                            className="font-medium"
                            style={{
                                color: activeTab === "AKTIF" ? "white" : "#6b7280"
                            }}
                        >
                            Penghuni Aktif
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab("NON AKTIF")}
                        className="px-4 py-2 rounded-md"
                        style={{
                            backgroundColor: activeTab === "NON AKTIF" ? "#2563eb" : "transparent"
                        }}
                    >
                        <Text
                            className="font-medium"
                            style={{
                                color: activeTab === "NON AKTIF" ? "white" : "#6b7280"
                            }}
                        >
                            Riwayat / Alumni
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg flex-1 ml-4">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        placeholder="Cari nama atau kamar..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="ml-2 flex-1 text-sm text-dark h-8 py-0"
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>
        </View>
    );
};
