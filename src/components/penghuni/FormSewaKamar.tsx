import React from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RoomOption {
    id: string;
    nomor: string;
}

interface RoomDataEntry {
    harga: number;
    fasilitas: string;
    kamar: RoomOption[];
}

interface FormSewaKamarProps {
    tipeKamar: string | null;
    setTipeKamar: (val: string | null) => void;
    kamar: string;
    setKamar: (val: string) => void;
    tglMasuk: string;
    setTglMasuk: (val: string) => void;
    durasiBulan: string;
    setDurasiBulan: (val: string) => void;
    roomData: Record<string, RoomDataEntry>;
    availableTipeList: readonly string[];
    totalTagihan: number;
    estimasiCheckOut: string;
    formatCurrency: (val: number) => string;
    isLoadingRooms?: boolean;
    roomsError?: string | null;
    onRetryLoadRooms?: () => void;
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
    availableTipeList,
    totalTagihan,
    estimasiCheckOut,
    formatCurrency,
    isLoadingRooms = false,
    roomsError = null,
    onRetryLoadRooms,
}) => {
    return (
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-dark">Data Sewa</Text>
                {isLoadingRooms ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                ) : null}
            </View>

            {isLoadingRooms ? (
                <View className="py-8 items-center">
                    <Text className="text-sm text-gray-500">Memuat kamar dari server...</Text>
                </View>
            ) : roomsError ? (
                <View className="py-4 px-3 bg-red-50 rounded-xl border border-red-100 mb-4">
                    <Text className="text-sm text-red-700 font-medium">{roomsError}</Text>
                    {onRetryLoadRooms ? (
                        <TouchableOpacity
                            onPress={onRetryLoadRooms}
                            className="mt-3 bg-primary py-2 px-4 rounded-lg self-start"
                        >
                            <Text className="text-white font-bold text-sm">Muat Ulang</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : availableTipeList.length === 0 ? (
                <View className="py-6 px-3 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                    <Text className="text-sm text-amber-800">
                        Tidak ada kamar tersedia. Tambahkan kamar di menu Data Kamar terlebih
                        dahulu.
                    </Text>
                </View>
            ) : (
                <>
                    <Text className="text-sm font-bold text-gray-600 mb-2">Pilih Tipe Kamar</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {availableTipeList.map((tipe) => (
                            <TouchableOpacity
                                key={tipe}
                                onPress={() => {
                                    setTipeKamar(tipe);
                                    setKamar("");
                                }}
                                className={`mr-3 p-4 rounded-xl border ${
                                    tipeKamar === tipe
                                        ? "border-primary bg-blue-50"
                                        : "border-gray-200 bg-white"
                                } min-w-[200px]`}
                            >
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text
                                        className={`font-bold text-lg ${
                                            tipeKamar === tipe ? "text-primary" : "text-dark"
                                        }`}
                                    >
                                        {tipe === "Lainnya" ? "Kamar Lainnya" : `Tipe ${tipe}`}
                                    </Text>
                                    <View className="bg-green-100 px-2 py-1 rounded-md">
                                        <Text className="text-xs font-bold text-green-700">
                                            {roomData[tipe].kamar.length} kamar
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-primary font-bold mb-1">
                                    {formatCurrency(roomData[tipe].harga)} / bln
                                </Text>
                                <Text className="text-xs text-gray-500">
                                    {roomData[tipe].fasilitas}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text className="text-sm font-bold text-gray-600 mb-2">Pilih Kamar *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {tipeKamar && roomData[tipeKamar] ? (
                            roomData[tipeKamar].kamar.map((room) => (
                                <TouchableOpacity
                                    key={room.id}
                                    onPress={() => setKamar(room.id)}
                                    className={`mr-2 px-4 py-2 rounded-lg border ${
                                        kamar === room.id
                                            ? "bg-primary border-primary"
                                            : "bg-white border-gray-200"
                                    }`}
                                >
                                    <Text
                                        className={`font-medium ${
                                            kamar === room.id ? "text-white" : "text-dark"
                                        }`}
                                    >
                                        {room.nomor}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text className="text-gray-400 p-2 bg-gray-50 rounded-lg">
                                Pilih tipe kamar terlebih dahulu
                            </Text>
                        )}
                    </ScrollView>
                </>
            )}

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
