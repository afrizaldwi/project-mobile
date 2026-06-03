import React from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTambahPenghuni } from "@/hooks/useTambahPenghuni";

import { FormInformasiPribadi } from "@/components/penghuni/FormInformasiPribadi";
import { FormSewaKamar } from "@/components/penghuni/FormSewaKamar";

const PAYMENT_METHODS = ["Tunai", "Transfer Bank", "E-Wallet"] as const;

export default function AdminTambahPenghuniScreen() {
    const {
        nama, setNama,
        noHp, setNoHp,
        alamatAsal, setAlamatAsal,
        tipeKamar, setTipeKamar,
        kamar, setKamar,
        tglMasuk, setTglMasuk,
        durasiBulan, setDurasiBulan,
        metodePembayaran, setMetodePembayaran,
        buktiBayar,
        pickBuktiBayar,
        createdCredentials,
        sendCredentialsToWhatsApp,
        finishCreatedPenghuni,
        totalTagihan,
        estimasiCheckOut,
        formatCurrency,
        handleSave,
        handleCancel,
        fetchAvailableRooms,
        roomData,
        availableTipeList,
        isSaving,
        isLoadingRooms,
        roomsError,
    } = useTambahPenghuni();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <View className="px-6 pt-6 pb-4 bg-white shadow-sm z-10">
                    <Text className="text-2xl font-bold text-dark">Tambah Penghuni Baru</Text>
                    <Text className="text-sm text-gray-500 mt-1">Membuat akun penyewa sekaligus mencatat sewa kamar.</Text>
                </View>

                <ScrollView
                    className="flex-1 px-6 pt-4"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <FormInformasiPribadi
                        nama={nama}
                        setNama={setNama}
                        noHp={noHp}
                        setNoHp={setNoHp}
                        alamatAsal={alamatAsal}
                        setAlamatAsal={setAlamatAsal}
                    />

                    <FormSewaKamar
                        tipeKamar={tipeKamar}
                        setTipeKamar={setTipeKamar}
                        kamar={kamar}
                        setKamar={setKamar}
                        tglMasuk={tglMasuk}
                        setTglMasuk={setTglMasuk}
                        durasiBulan={durasiBulan}
                        setDurasiBulan={setDurasiBulan}
                        roomData={roomData}
                        availableTipeList={availableTipeList}
                        totalTagihan={totalTagihan}
                        estimasiCheckOut={estimasiCheckOut}
                        formatCurrency={formatCurrency}
                        isLoadingRooms={isLoadingRooms}
                        roomsError={roomsError}
                        onRetryLoadRooms={fetchAvailableRooms}
                    />

                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
                        <Text className="text-lg font-bold text-dark mb-4">Pembayaran Awal</Text>

                        <Text className="text-sm font-bold text-gray-600 mb-2">Metode Pembayaran *</Text>
                        <View className="flex-row gap-2 mb-4">
                            {PAYMENT_METHODS.map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    onPress={() => setMetodePembayaran(method)}
                                    className={`flex-1 rounded-lg border px-3 py-3 ${
                                        metodePembayaran === method
                                            ? "border-primary bg-blue-50"
                                            : "border-gray-200 bg-gray-50"
                                    }`}
                                >
                                    <Text
                                        className={`text-center text-xs font-bold ${
                                            metodePembayaran === method ? "text-primary" : "text-gray-600"
                                        }`}
                                    >
                                        {method}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-sm font-bold text-gray-600 mb-2">Bukti Bayar *</Text>
                        <TouchableOpacity
                            onPress={pickBuktiBayar}
                            className={`rounded-lg border border-dashed px-4 py-5 ${
                                buktiBayar ? "border-primary bg-blue-50" : "border-gray-300 bg-gray-50"
                            }`}
                        >
                            <Text className={`text-center text-sm font-bold ${buktiBayar ? "text-primary" : "text-gray-600"}`}>
                                {buktiBayar ? buktiBayar.name : "Pilih Bukti Pembayaran (Gambar/PDF)"}
                            </Text>
                            <Text className="mt-1 text-center text-xs text-gray-400">
                                JPG, JPEG, PNG, atau PDF
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <Modal visible={Boolean(createdCredentials)} transparent animationType="fade">
                    <View className="flex-1 justify-center bg-black/50 px-6">
                        <View className="rounded-xl bg-white p-5">
                            <Text className="text-xl font-bold text-dark">Penghuni Berhasil Dibuat</Text>
                            <Text className="mt-2 text-sm text-gray-500">Simpan atau kirim data login ini ke penyewa.</Text>

                            <View className="mt-4 rounded-lg bg-gray-50 p-4">
                                <Text className="text-xs font-bold uppercase text-gray-500">Email</Text>
                                <Text className="mt-1 text-base font-bold text-dark">{createdCredentials?.email || "-"}</Text>
                                <Text className="mt-4 text-xs font-bold uppercase text-gray-500">Password Sementara</Text>
                                <Text className="mt-1 text-base font-bold text-dark">{createdCredentials?.temporaryPassword || "-"}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={sendCredentialsToWhatsApp}
                                className="mt-4 rounded-lg bg-green-600 px-4 py-3"
                            >
                                <Text className="text-center font-bold text-white">Kirim via WhatsApp</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={finishCreatedPenghuni}
                                className="mt-3 rounded-lg border border-gray-200 px-4 py-3"
                            >
                                <Text className="text-center font-bold text-gray-600">Selesai</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
                        disabled={isSaving || isLoadingRooms}
                        className={`bg-primary px-6 py-3 rounded-lg shadow-sm flex-row items-center ${isSaving || isLoadingRooms ? "opacity-70" : ""}`}
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
