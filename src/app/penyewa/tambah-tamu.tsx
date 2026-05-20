import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { tamuService } from "@/api/tamuService";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function TambahTamuScreen() {
    const router = useRouter();
    const [nama, setNama] = useState("");
    const [noHp, setNoHp] = useState("");
    const [keperluan, setKeperluan] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!nama.trim() || !noHp.trim() || !keperluan.trim()) {
            Alert.alert("Validasi Error", "Semua kolom wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        try {
            await tamuService.createPenyewaTamu({
                nama_tamu: nama,
                no_hp_tamu: noHp,
                keperluan: keperluan,
            });

            Alert.alert("Sukses", "Data tamu berhasil ditambahkan.", [
                {
                    text: "OK",
                    onPress: () => {
                        router.back();
                    },
                },
            ]);
        } catch (error: any) {
            console.error("Failed to submit tamu:", error);
            Alert.alert(
                "Error",
                error.response?.data?.message || "Terjadi kesalahan saat menambahkan tamu."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView className="flex-1 bg-secondary">
                    <View className="px-6 py-4">
                        <Text className="text-3xl font-extrabold text-dark">Tambah Tamu</Text>
                        <Text className="text-sm text-gray-500">Catat kunjungan tamu Anda</Text>
                    </View>

                    <View className="px-6 pb-12">
                        <View className="mb-4">
                            <Text className="mb-2 text-sm font-bold text-gray-700">Nama Lengkap Tamu</Text>
                            <TextInput
                                value={nama}
                                onChangeText={setNama}
                                placeholder="Contoh: Budi Santoso"
                                className="rounded-xl border border-gray-200 bg-white p-4 text-base text-dark"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="mb-2 text-sm font-bold text-gray-700">Nomor HP</Text>
                            <TextInput
                                value={noHp}
                                onChangeText={setNoHp}
                                placeholder="Contoh: 08123456789"
                                keyboardType="phone-pad"
                                className="rounded-xl border border-gray-200 bg-white p-4 text-base text-dark"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="mb-2 text-sm font-bold text-gray-700">Keperluan Kunjungan</Text>
                            <TextInput
                                value={keperluan}
                                onChangeText={setKeperluan}
                                placeholder="Contoh: Mengantar barang pesanan..."
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                className="min-h-[100px] rounded-xl border border-gray-200 bg-white p-4 text-base text-dark"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            className={`items-center justify-center rounded-xl py-4 ${
                                isSubmitting ? "bg-gray-400" : "bg-primary"
                            }`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-lg font-bold text-white">Simpan Data Tamu</Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ProtectedRoute>
    );
}
