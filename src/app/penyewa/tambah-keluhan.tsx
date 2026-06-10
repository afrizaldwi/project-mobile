import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { keluhanService } from "@/api/keluhanService";
import { useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { markKeluhanCacheDirty } from "@/database/keluhanRepository";
import { markPenyewaKeluhanDirty } from "@/database/penyewaKeluhanRepository";
import { getConnectivityStatus } from "@/network/connectivity";

export default function TambahKeluhanScreen() {
    const router = useRouter();
    const db = useSQLiteContext();
    const { user } = useAuth();
    const [judul, setJudul] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickImage = async (useCamera: boolean) => {
        try {
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Izin Ditolak", "Maaf, kami membutuhkan izin kamera untuk fitur ini.");
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ["images"],
                    allowsEditing: false,
                    quality: 0.7,
                });

                if (!result.canceled && result.assets) {
                    if (images.length < 3) {
                        setImages((prev) => [...prev, result.assets[0]]);
                    } else {
                        Alert.alert("Batas Maksimal", "Maksimal 3 foto yang dapat diunggah.");
                    }
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("Izin Ditolak", "Maaf, kami membutuhkan izin galeri foto untuk fitur ini.");
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: false,
                    quality: 0.7,
                    allowsMultipleSelection: true,
                    selectionLimit: 3 - images.length,
                });

                if (!result.canceled && result.assets) {
                    const newAssets = result.assets.slice(0, 3 - images.length);
                    setImages((prev) => [...prev, ...newAssets]);
                }
            }
        } catch (error) {
            console.error("ImagePicker Error:", error);
            Alert.alert("Error", "Gagal membuka fitur gambar.");
        }
    };

    const handlePickImagePress = () => {
        if (images.length >= 3) {
            Alert.alert("Batas Maksimal", "Anda sudah memilih maksimal 3 foto.");
            return;
        }

        Alert.alert(
            "Pilih Sumber Foto",
            "Darimana Anda ingin mengambil foto kerusakan?",
            [
                { text: "Kamera", onPress: () => pickImage(true) },
                { text: "Galeri", onPress: () => pickImage(false) },
                { text: "Batal", style: "cancel" },
            ],
            { cancelable: true }
        );
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (await getConnectivityStatus() === "offline") {
            Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet.");
            return;
        }
        if (!judul.trim() || !deskripsi.trim()) {
            Alert.alert("Validasi Error", "Judul dan deskripsi keluhan wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        try {
            await keluhanService.createPenyewaKeluhan({
                judul_keluhan: judul,
                deskripsi_keluhan: deskripsi,
                images,
            });
            await markKeluhanCacheDirty(db).catch(() => undefined);
            if (user) {
                await markPenyewaKeluhanDirty(db, `penyewa:${user.id}`).catch(
                    () => undefined,
                );
            }

            Alert.alert("Sukses", "Laporan keluhan berhasil dikirim.", [
                {
                    text: "OK",
                    onPress: () => {
                        router.back();
                    },
                },
            ]);
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.response?.data?.message || "Terjadi kesalahan saat mengirim keluhan."
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
                        <Text className="text-3xl font-extrabold text-dark">Tambah Keluhan</Text>
                        <Text className="text-sm text-gray-500">Laporkan masalah atau kerusakan</Text>
                    </View>

                    <View className="px-6 pb-12">
                        <View className="mb-4">
                            <Text className="mb-2 text-sm font-bold text-gray-700">Judul Keluhan</Text>
                            <TextInput
                                value={judul}
                                onChangeText={setJudul}
                                placeholder="Contoh: AC Kamar Bocor"
                                className="rounded-xl border border-gray-200 bg-white p-4 text-base text-dark"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="mb-2 text-sm font-bold text-gray-700">Deskripsi</Text>
                            <TextInput
                                value={deskripsi}
                                onChangeText={setDeskripsi}
                                placeholder="Jelaskan detail kerusakan secara lengkap..."
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                className="min-h-[120px] rounded-xl border border-gray-200 bg-white p-4 text-base text-dark"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View className="mb-6">
                            <View className="mb-2 flex-row items-center justify-between">
                                <Text className="text-sm font-bold text-gray-700">Foto Bukti (Maks. 3)</Text>
                                <Text className="text-xs text-gray-500">{images.length}/3</Text>
                            </View>

                            <View className="flex-row flex-wrap items-center">
                                {images.map((img, index) => (
                                    <View key={index} className="relative mb-3 mr-3">
                                        <Image
                                            source={{ uri: img.uri }}
                                            className="h-24 w-24 rounded-xl border border-gray-200 bg-gray-100"
                                        />
                                        <Pressable
                                            onPress={() => removeImage(index)}
                                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1"
                                        >
                                            <Ionicons name="close" size={16} color="white" />
                                        </Pressable>
                                    </View>
                                ))}

                                {images.length < 3 && (
                                    <Pressable
                                        onPress={handlePickImagePress}
                                        className="mb-3 h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-primary bg-blue-50"
                                    >
                                        <Ionicons name="camera" size={32} color="#2563eb" />
                                        <Text className="mt-1 text-xs font-semibold text-primary">Tambah</Text>
                                    </Pressable>
                                )}
                            </View>
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
                                <Text className="text-lg font-bold text-white">Kirim Laporan</Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ProtectedRoute>
    );
}
