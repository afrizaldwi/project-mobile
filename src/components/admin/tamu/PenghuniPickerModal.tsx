import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from "react-native";

import { PenghuniAktif } from "@/api/tamuService";

interface PenghuniPickerModalProps {
    visible: boolean;
    loading: boolean;
    penghuniList: PenghuniAktif[];
    onClose: () => void;
    onSelect: (idUser: number) => void;
}

export function PenghuniPickerModal({
    visible,
    loading,
    penghuniList,
    onClose,
    onSelect,
}: PenghuniPickerModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="h-2/3 rounded-t-3xl bg-white p-6">
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-xl font-bold text-dark">Pilih Penghuni</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color="#1f2938" />
                        </Pressable>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
                    ) : (
                        <FlatList
                            data={penghuniList}
                            keyExtractor={(item) => item.id_user.toString()}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => onSelect(item.id_user)}
                                    className="mb-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
                                >
                                    <Text className="font-bold text-dark">{item.nama_penghuni}</Text>
                                    <Text className="text-sm text-gray-500">
                                        Kamar:{" "}
                                        <Text className="font-semibold text-primary">
                                            {item.nomor_kamar}
                                        </Text>
                                    </Text>
                                </Pressable>
                            )}
                            ListEmptyComponent={
                                <Text className="mt-10 text-center text-gray-500">
                                    Tidak ada penghuni aktif yang ditemukan.
                                </Text>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}
