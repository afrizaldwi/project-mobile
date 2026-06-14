import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { PenghuniViewModel } from "@/hooks/usePenghuni";

interface PenghuniCardProps {
    item: PenghuniViewModel;
    /** Dipanggil saat pengguna menekan "Arsipkan" — meneruskan data penghuni ke parent untuk konfirmasi modal */
    onArchive: (item: PenghuniViewModel) => void;
    onPerpanjang: (item: PenghuniViewModel) => void;
    isOffline: boolean;
}

export const PenghuniCard: React.FC<PenghuniCardProps> = ({
    item,
    onArchive,
    onPerpanjang,
    isOffline,
}) => {
    const isActive = item.status === "AKTIF";

    return (
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            {/* Top row: Kamar Info & Status */}
            <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                    <View className="bg-blue-50 px-3 py-1 rounded-lg mr-2">
                        <Text className="font-bold text-blue-600 text-sm">{item.kamar}</Text>
                    </View>
                    <Text className="text-xs text-gray-400 font-medium">{item.ukuranKamar}</Text>
                </View>
                <View
                    className="px-2.5 py-0.5 rounded-full"
                    style={{
                        backgroundColor:
                            isActive
                                ? "#dcfce7"
                                : item.status === "SELESAI"
                                    ? "#dbeafe"
                                    : "#fee2e2",
                    }}
                >
                    <Text
                        className="text-xs font-bold"
                        style={{
                            color:
                                isActive
                                    ? "#16a34a"
                                    : item.status === "SELESAI"
                                        ? "#2563eb"
                                        : "#dc2626",
                        }}
                    >
                        {item.status}
                    </Text>
                </View>
            </View>

            {/* Nama & Email */}
            <View className="mb-3">
                <Text className="font-bold text-dark text-lg">{item.nama}</Text>
                <Text className="text-sm text-gray-500 mt-0.5">{item.email}</Text>
            </View>

            {/* Divider */}
            <View className="h-[1px] bg-gray-100 my-2" />

            {/* Periode Sewa */}
            <View className="flex-row justify-between py-1.5">
                <View className="flex-1">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Tanggal Masuk
                    </Text>
                    <Text className="text-sm font-semibold text-gray-700 mt-1">
                        {item.tglMasuk}
                    </Text>
                </View>
                <View className="flex-1 items-end">
                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Tanggal Keluar
                    </Text>
                    <Text className="text-sm font-semibold text-gray-700 mt-1">
                        {item.tglKeluar}
                    </Text>
                </View>
            </View>

            {/* Action Buttons — hanya untuk penghuni aktif dan saat online */}
            {isActive && !isOffline && (
                <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-gray-100">
                    <TouchableOpacity
                        onPress={() => onPerpanjang(item)}
                        className="mr-4 px-3 py-1.5 rounded-lg bg-gray-50"
                    >
                        <Text className="text-xs font-semibold text-gray-500">Perpanjang</Text>
                    </TouchableOpacity>
                    {/* Meneruskan seluruh item ke parent untuk ditampilkan di ConfirmationModal */}
                    <TouchableOpacity
                        onPress={() => onArchive(item)}
                        className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                    >
                        <Text className="text-xs font-semibold text-red-600">Arsipkan</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
