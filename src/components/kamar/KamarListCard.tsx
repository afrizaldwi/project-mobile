import { Pressable, Text, View } from "react-native";
import { formatHarga, formatTanggal } from "@/api/kamarService";
import type { Kamar } from "@/types/kamar";
import { StatusBadge } from "./StatusBadge";

type KamarListCardProps = {
    kamar: Kamar;
    onEdit: () => void;
    onHapus: () => void;
};

export function KamarListCard({ kamar, onEdit, onHapus }: KamarListCardProps) {
    return (
        <View
            className="mb-3 overflow-hidden rounded-2xl bg-white"
            style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 }}
        >
            <View className="flex-row items-start justify-between p-3">
                <View className="flex-1">
                    <Text className="text-sm font-bold text-dark">No. {kamar.nomor_kamar}</Text>
                    <Text className="text-[10px] text-gray-500">📐 {kamar.luas_kamar}</Text>
                </View>
                <View className="items-end gap-1.5">
                    <Text className="text-xs font-semibold text-primary">
                        {formatHarga(kamar.harga_bulanan)}
                    </Text>
                    <StatusBadge status={kamar.status_kamar} />
                </View>
            </View>

            <View className="border-t border-gray-100 px-3 pb-2 pt-1.5">
                <Text className="text-[10px] text-gray-500" numberOfLines={2}>
                    {kamar.fasilitas}
                </Text>
                <Text className="mt-1 text-[9px] text-gray-400">
                    Ditambahkan: {formatTanggal(kamar.created_at)}
                </Text>
                <Text className="text-[9px] text-gray-400">
                    Terakhir diedit: {formatTanggal(kamar.updated_at)}
                </Text>
            </View>

            <View className="flex-row gap-2 border-t border-gray-100 px-3 py-2">
                <Pressable
                    onPress={onEdit}
                    className="flex-1 items-center rounded-xl bg-blue-50 py-2 active:opacity-70"
                >
                    <Text className="text-xs font-semibold text-primary">✏️ Edit</Text>
                </Pressable>
                <Pressable
                    onPress={onHapus}
                    className="flex-1 items-center rounded-xl bg-red-50 py-2 active:opacity-70"
                >
                    <Text className="text-xs font-semibold text-red-600">🗑️ Hapus</Text>
                </Pressable>
            </View>
        </View>
    );
}
