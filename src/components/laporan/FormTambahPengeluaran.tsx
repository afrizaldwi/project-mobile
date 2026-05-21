import React from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormTambahPengeluaranProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    form: {
        judul_pengeluaran: string;
        jumlah_pengeluaran: string;
        tanggal_pengeluaran: string;
        deskripsi: string;
    };
    onChangeForm: (field: string, value: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export const FormTambahPengeluaran: React.FC<FormTambahPengeluaranProps> = ({
    isCollapsed,
    setIsCollapsed,
    form,
    onChangeForm,
    onSubmit,
    isSubmitting,
}) => {
    if (isCollapsed) return null;

    return (
        <View className="mx-6 mb-6 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-dark">Catatan Pengeluaran Baru</Text>
                <TouchableOpacity onPress={() => setIsCollapsed(true)} className="p-1">
                    <Ionicons name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* Input Judul */}
            <View className="mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Judul Pengeluaran *</Text>
                <TextInput
                    placeholder="Contoh: Beli Token Listrik, Perbaikan Pompa"
                    value={form.judul_pengeluaran}
                    onChangeText={(val) => onChangeForm("judul_pengeluaran", val)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-dark text-sm"
                    placeholderTextColor="#9ca3af"
                />
            </View>

            {/* Input Nominal & Tanggal Row */}
            <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jumlah (Rp) *</Text>
                    <TextInput
                        placeholder="0"
                        keyboardType="numeric"
                        value={form.jumlah_pengeluaran}
                        onChangeText={(val) => onChangeForm("jumlah_pengeluaran", val)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-dark text-sm"
                        placeholderTextColor="#9ca3af"
                    />
                </View>
                <View className="flex-1 ml-2">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal *</Text>
                    <TextInput
                        placeholder="YYYY-MM-DD"
                        value={form.tanggal_pengeluaran}
                        onChangeText={(val) => onChangeForm("tanggal_pengeluaran", val)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-dark text-sm"
                        placeholderTextColor="#9ca3af"
                    />
                </View>
            </View>

            {/* Input Deskripsi */}
            <View className="mb-5">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi (Opsional)</Text>
                <TextInput
                    placeholder="Catatan tambahan..."
                    multiline={true}
                    numberOfLines={3}
                    value={form.deskripsi}
                    onChangeText={(val) => onChangeForm("deskripsi", val)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-dark text-sm text-left"
                    placeholderTextColor="#9ca3af"
                    textAlignVertical="top"
                />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                onPress={onSubmit}
                disabled={isSubmitting}
                className="bg-primary py-3.5 rounded-xl items-center flex-row justify-center shadow-sm"
            >
                {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                ) : (
                    <Ionicons name="checkmark-circle-outline" size={18} color="white" className="mr-2" />
                )}
                <Text className="font-bold text-white text-sm">
                    {isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};
