import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { Tamu } from "@/types";

interface TamuCardProps {
    tamu: Tamu;
    isAdmin?: boolean;
    onDelete?: (id: number) => void;
}

export function TamuCard({ tamu, isAdmin = false, onDelete }: TamuCardProps) {
    const handleDelete = () => {
        Alert.alert(
            "Konfirmasi Hapus",
            "Apakah Anda yakin ingin menghapus data tamu ini?",
            [
                { text: "Batal", style: "cancel" },
                { text: "Hapus", style: "destructive", onPress: () => onDelete?.(tamu.id_tamu) },
            ]
        );
    };

    return (
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-md elevation-md">
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-100 pb-3">
                <View>
                    <Text className="text-lg font-bold text-dark">{tamu.nama_tamu}</Text>
                    <Text className="text-sm text-gray-500">{tamu.no_hp_tamu}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs font-medium text-gray-500">Waktu Kunjungan</Text>
                    <Text className="text-sm font-semibold text-primary">
                        {new Date(tamu.waktu_berkunjung).toLocaleDateString("id-ID")}
                    </Text>
                    <Text className="text-xs font-semibold text-primary">
                        {new Date(tamu.waktu_berkunjung).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                </View>
            </View>

            <View className="mb-2">
                <Text className="text-xs font-semibold text-gray-400">Keperluan</Text>
                <Text className="text-sm text-gray-700">{tamu.keperluan}</Text>
            </View>

            {isAdmin && (
                <View className="mb-3 rounded-lg bg-secondary p-3">
                    <Text className="text-xs font-semibold text-gray-500">Mengunjungi Penghuni:</Text>
                    <Text className="text-sm font-bold text-dark">{tamu.nama_penghuni}</Text>
                    <Text className="text-xs text-gray-600">Kamar {tamu.nomor_kamar}</Text>
                </View>
            )}

            {isAdmin && onDelete && (
                <View className="mt-2 flex-row justify-end pt-2 border-t border-gray-50">
                    <Pressable 
                        onPress={handleDelete}
                        className="flex-row items-center rounded-lg bg-red-50 px-4 py-2"
                    >
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                        <Text className="ml-2 text-sm font-semibold text-danger">Hapus</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
