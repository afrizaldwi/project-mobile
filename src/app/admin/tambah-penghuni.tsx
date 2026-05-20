import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTambahPenghuni } from "@/hooks/useTambahPenghuni";

export default function AdminTambahPenghuniScreen() {
    const {
        nama, setNama,
        noHp, setNoHp,
        email, setEmail,
        password, setPassword,
        alamatAsal, setAlamatAsal,
        tipeKamar, setTipeKamar,
        kamar, setKamar,
        tglMasuk, setTglMasuk,
        durasiBulan, setDurasiBulan,
        totalTagihan,
        estimasiCheckOut,
        formatCurrency,
        handleSave,
        handleCancel,
        roomData,
    } = useTambahPenghuni();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <View className="px-6 pt-6 pb-4 bg-white shadow-sm z-10">
                    <Text className="text-2xl font-bold text-dark">Tambah Penghuni Baru</Text>
                    <Text className="text-sm text-gray-500 mt-1">Membuat akun penyewa sekaligus mencatat sewa kamar.</Text>
                </View>

                <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {/* Section 1: Data Penghuni */}
                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold text-dark mb-4">Data Penghuni</Text>

                        <View className="flex-row justify-between mb-4">
                            <View className="flex-1 mr-2">
                                <Text className="text-sm font-bold text-gray-600 mb-1">Nama Lengkap *</Text>
                                <TextInput
                                    className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50"
                                    value={nama}
                                    onChangeText={(text) => {
                                        setNama(text);
                                        setEmail(text.toLowerCase().replace(/\s+/g, '') + "@kost.com");
                                    }}
                                />
                            </View>
                            <View className="flex-1 ml-2">
                                <Text className="text-sm font-bold text-gray-600 mb-1">No. HP *</Text>
                                <TextInput
                                    className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50"
                                    keyboardType="phone-pad"
                                    value={noHp}
                                    onChangeText={setNoHp}
                                />
                            </View>
                        </View>

                        <View className="flex-row justify-between mb-4">
                            <View className="flex-1 mr-2">
                                <Text className="text-sm font-bold text-gray-600 mb-1">Email *</Text>
                                <TextInput
                                    className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                                <Text className="text-xs text-gray-400 mt-1">Email dibuat otomatis dari nama, tapi masih bisa diedit.</Text>
                            </View>
                            <View className="flex-1 ml-2">
                                <Text className="text-sm font-bold text-gray-600 mb-1">Password *</Text>
                                <TextInput
                                    className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <Text className="text-xs text-gray-400 mt-1">Berikan password ini kepada penghuni.</Text>
                            </View>
                        </View>

                        <View className="mb-2">
                            <Text className="text-sm font-bold text-gray-600 mb-1">Alamat Asal</Text>
                            <TextInput
                                className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50 text-top h-24"
                                multiline
                                numberOfLines={4}
                                value={alamatAsal}
                                onChangeText={setAlamatAsal}
                                style={{ textAlignVertical: "top" }}
                            />
                        </View>
                    </View>

                    {/* Section 2: Data Sewa */}
                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold text-dark mb-4">Data Sewa</Text>

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

                        <Text className="text-sm font-bold text-gray-600 mb-2">Pilih Kamar *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {tipeKamar ? (
                                roomData[tipeKamar].kamar.map((room) => (
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

                        <View className="flex-row justify-between mb-4 mt-2">
                            <View className="flex-1 mr-2">
                                <Text className="text-sm font-bold text-gray-600 mb-1">Tanggal Masuk *</Text>
                                <View className="relative">
                                    <TextInput
                                        className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50"
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
                                    className="border border-gray-200 rounded-lg p-3 text-dark bg-gray-50"
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
                </ScrollView>

                {/* Footer Buttons */}
                <View className="bg-white p-4 border-t border-gray-200 flex-row justify-end absolute bottom-0 w-full z-10 pb-8">
                    <TouchableOpacity 
                        onPress={handleCancel} 
                        disabled={isSaving}
                        className={`px-6 py-3 mr-3 rounded-lg ${isSaving ? "opacity-50" : ""}`}
                    >
                        <Text className="font-bold text-gray-500">Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleSave} 
                        disabled={isSaving}
                        className={`bg-primary px-6 py-3 rounded-lg shadow-sm flex-row items-center ${isSaving ? "opacity-70" : ""}`}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                        ) : null}
                        <Text className="font-bold text-white">
                            {isSaving ? "Menyimpan..." : "Simpan Penghuni"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ProtectedRoute>
    );
}
