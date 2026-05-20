import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { PenghuniAktif } from "@/api/tamuService";

interface PenghuniSelectFieldProps {
    selectedPenghuni?: PenghuniAktif;
    onPress: () => void;
}

export function PenghuniSelectField({ selectedPenghuni, onPress }: PenghuniSelectFieldProps) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-bold text-gray-700">Penghuni yang Dikunjungi</Text>
            <Pressable
                onPress={onPress}
                className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
                <Text className={`text-base ${selectedPenghuni ? "text-dark" : "text-gray-400"}`}>
                    {selectedPenghuni
                        ? `${selectedPenghuni.nama_penghuni} (Kamar ${selectedPenghuni.nomor_kamar})`
                        : "Pilih Penghuni Aktif..."}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </Pressable>
        </View>
    );
}
