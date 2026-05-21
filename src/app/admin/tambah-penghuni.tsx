import React from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTambahPenghuni } from "@/hooks/useTambahPenghuni";

// Import extracted components
import { FormInformasiPribadi } from "@/components/penghuni/FormInformasiPribadi";
import { FormSewaKamar } from "@/components/penghuni/FormSewaKamar";

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
        isSaving, // Destructuring isSaving correctly here
    } = useTambahPenghuni();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                {/* Header Title */}
                <View className="px-6 pt-6 pb-4 bg-white shadow-sm z-10">
                    <Text className="text-2xl font-bold text-dark">Tambah Penghuni Baru</Text>
                    <Text className="text-sm text-gray-500 mt-1">Membuat akun penyewa sekaligus mencatat sewa kamar.</Text>
                </View>

                {/* Form Sections */}
                <ScrollView 
                    className="flex-1 px-6 pt-4" 
                    contentContainerStyle={{ paddingBottom: 100 }} 
                    showsVerticalScrollIndicator={false}
                >
                    {/* Section 1: Data Penghuni (Personal details) */}
                    <FormInformasiPribadi
                        nama={nama}
                        setNama={setNama}
                        noHp={noHp}
                        setNoHp={setNoHp}
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        alamatAsal={alamatAsal}
                        setAlamatAsal={setAlamatAsal}
                    />

                    {/* Section 2: Data Sewa (Room, Dates, Duration) */}
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
                        totalTagihan={totalTagihan}
                        estimasiCheckOut={estimasiCheckOut}
                        formatCurrency={formatCurrency}
                    />
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
