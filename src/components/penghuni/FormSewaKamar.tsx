import React from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormSewaKamarProps {
    tipeKamar: "A" | "B" | "C" | null;
    setTipeKamar: (val: "A" | "B" | "C" | null) => void;
    kamar: string;
    setKamar: (val: string) => void;
    tglMasuk: string;
    setTglMasuk: (val: string) => void;
    durasiBulan: string;
    setDurasiBulan: (val: string) => void;
    roomData: any;
    totalTagihan: number;
    estimasiCheckOut: string;
    formatCurrency: (val: number) => string;
}

export const FormSewaKamar: React.FC<FormSewaKamarProps> = ({
    tipeKamar,
    setTipeKamar,
    kamar,
    setKamar,
    tglMasuk,
    setTglMasuk,
    durasiBulan,
    setDurasiBulan,
    roomData,
    totalTagihan,
    estimasiCheckOut,
    formatCurrency,
}) => {
    return (
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-dark mb-4">Data Sewa</Text>

            {/* Select Room Type */}
            <Text className="text-sm font-bold text-gray-600 mb-2">Pilih Tipe Kamar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {(["A", "B", "C"] as const).map((tipe) => (
                    <TouchableOpacity
                        key={tipe}
                        onPress={() => {
                            setTipeKamar(tipe);
                            setKamar(""); // Reset kamar when type changes
                        }}
                        className={`mr-3 p-4 rounded-xl border ${tipeKamar === tipe ? "border-primary bg-blue-50" : "border-gray-200 bg-white"} min-w-[200px]`}
                    >
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className={`font-bold text-lg ${tipeKamar === tipe ? "text-primary" : "text-dark"}`}>
                                Tipe {tipe}
                            </Text>
                            <View className="bg-green-100 px-2 py-1 rounded-md">
                                <Text className="text-xs font-bold text-green-700">TERSEDIA</Text>
                            </View>
                        </View>
                        <Text className="text-primary font-bold mb-1">{formatCurrency(roomData[tipe].harga)} / bln</Text>
                        <Text className="text-xs text-gray-500">{roomData[tipe].fasilitas}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Select Room Number */}
            <Text className="text-sm font-bold text-gray-600 mb-2">Pilih Kamar *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {tipeKamar ? (
                    roomData[tipeKamar].kamar.map((room: any) => (
                        <TouchableOpacity
                            key={room.id}
                            onPress={() => setKamar(room.id)}
                            className={`mr-2 px-4 py-2 rounded-lg border ${kamar === room.id ? "bg-primary border-primary" : "bg-white border-gray-200"}`}
                        >
                            <Text className={`font-medium ${kamar === room.id ? "text-white" : "text-dark"}`}>{room.nomor}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text className="text-gray-400 p-2 bg-gray-50 rounded-lg w-full">Pilih tipe kamar terlebih dahulu</Text>
                )}
            </ScrollView>

            {/* Dates & Duration row */}
            <View className="flex-row justify-between mb-4 mt-2">
                <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-gray-600 mb-1">Tanggal Masuk *</Text>
                    <View className="relative">
                        <TextInput
                            className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50 text-sm"
                            value={tglMasuk}
                            onChangeText={setTglMasuk}
                        />
                        <View className="absolute right-3 top-3">
                            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                        </View>
                    </View>
                </View>
                <View className="flex-1 ml-2">
                    <Text className="text-sm font-bold text-gray-600 mb-1">Durasi (Bulan) *</Text>
                    <TextInput
                        className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50 text-sm"
                        keyboardType="numeric"
                        value={durasiBulan}
                        onChangeText={setDurasiBulan}
                    />
                </View>
            </View>

            {/* Summary Box */}
            <View className="bg-secondary rounded-xl p-4 flex-row justify-between items-center mt-2">
                <View>
                    <Text className="text-sm font-medium text-primary">Total Tagihan Awal</Text>
                    <Text className="text-2xl font-bold text-dark mt-1">
                        {totalTagihan === 0 ? "Rp 0" : formatCurrency(totalTagihan)}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="text-sm font-medium text-primary">Estimasi Check-Out:</Text>
                    <Text className="text-lg font-bold text-dark mt-1">{estimasiCheckOut}</Text>
                </View>
            </View>
        </View>
    );
};
