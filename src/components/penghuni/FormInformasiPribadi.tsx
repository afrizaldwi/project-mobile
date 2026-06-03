import React from "react";
import { View, Text, TextInput } from "react-native";

interface FormInformasiPribadiProps {
    nama: string;
    setNama: (val: string) => void;
    noHp: string;
    setNoHp: (val: string) => void;
    alamatAsal: string;
    setAlamatAsal: (val: string) => void;
}

export const FormInformasiPribadi: React.FC<FormInformasiPribadiProps> = ({
    nama,
    setNama,
    noHp,
    setNoHp,
    alamatAsal,
    setAlamatAsal,
}) => {
    return (
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-dark mb-4">Data Penghuni</Text>

            <View className="flex-row justify-between mb-4">
                <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-gray-600 mb-1">Nama Lengkap *</Text>
                    <TextInput
                        className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50 text-sm"
                        value={nama}
                        onChangeText={setNama}
                    />
                </View>
                <View className="flex-1 ml-2">
                    <Text className="text-sm font-bold text-gray-600 mb-1">No. HP *</Text>
                    <TextInput
                        className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50 text-sm"
                        keyboardType="phone-pad"
                        value={noHp}
                        onChangeText={setNoHp}
                    />
                </View>
            </View>

            <View className="mb-2">
                <Text className="text-sm font-bold text-gray-600 mb-1">Alamat Asal *</Text>
                <TextInput
                    className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50 text-sm text-top h-24"
                    multiline
                    numberOfLines={4}
                    value={alamatAsal}
                    onChangeText={setAlamatAsal}
                    style={{ textAlignVertical: "top" }}
                />
            </View>
        </View>
    );
};
