import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createKamar } from "@/api/kamarService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { FotoPayload, KamarPayload, KamarStatus } from "@/types/kamar";

const STATUS_OPTIONS: { label: string; value: KamarStatus; color: string }[] = [
    { label: "Tersedia", value: "tersedia", color: "#16a34a" },
    { label: "Terisi", value: "terisi", color: "#dc2626" },
];

export default function KamarTambahScreen() {
    const insets = useSafeAreaInsets();

    const [nomorKamar, setNomorKamar] = useState("");
    const [luasKamar, setLuasKamar] = useState("");
    const [fasilitas, setFasilitas] = useState("");
    const [harga, setHarga] = useState("");
    const [status, setStatus] = useState<KamarStatus>("tersedia");
    const [foto, setFoto] = useState<FotoPayload | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePilihFoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Izin Diperlukan", "Izinkan akses galeri untuk memilih foto kamar.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            const fileName = asset.uri.split("/").pop() ?? "foto.jpg";
            const fileType = asset.mimeType ?? "image/jpeg";
            setFotoPreview(asset.uri);
            setFoto({ uri: asset.uri, name: fileName, type: fileType });
        }
    };

    const handleSimpan = async () => {
        if (!nomorKamar.trim() || !luasKamar.trim() || !harga.trim() || !fasilitas.trim()) {
            Alert.alert("Validasi", "Semua field wajib diisi.");
            return;
        }
        const hargaNum = harga.replace(/\D/g, "");
        if (!hargaNum || parseInt(hargaNum) <= 0) {
            Alert.alert("Validasi", "Harga harus berupa angka yang valid.");
            return;
        }
        const payload: KamarPayload = {
            nomor_kamar: nomorKamar.trim(),
            luas_kamar: luasKamar.trim(),
            fasilitas: fasilitas.trim(),
            harga_bulanan: hargaNum,
            status_kamar: status,
            ...(foto ? { foto_kamar: foto } : {}),
        };
        try {
            setLoading(true);
            await createKamar(payload);
            Alert.alert("Berhasil", "Kamar berhasil ditambahkan.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? "Gagal menambah kamar. Coba lagi.";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text className="mb-2 text-xs text-gray-400">
                        <Text className="text-primary" onPress={() => router.back()}>
                            Data Kamar
                        </Text>
                        {" › "}Tambah Kamar Baru
                    </Text>

                    <Text className="mb-1 text-2xl font-extrabold text-dark">
                        Tambah Kamar Baru
                    </Text>
                    <Text className="mb-6 text-xs text-gray-500">
                        Isi detail kamar yang ingin ditambahkan
                    </Text>

                    <View className="rounded-2xl bg-white p-4" style={{ elevation: 2 }}>
                        <Text className="mb-0.5 text-sm font-bold text-dark">Detail Kamar</Text>
                        <Text className="mb-5 text-xs text-gray-400">
                            Semua field bertanda * wajib diisi
                        </Text>

                        <View className="mb-4 flex-row gap-3">
                            <View className="flex-1">
                                <Text className="mb-1.5 text-xs font-semibold text-dark">
                                    Nomor Kamar <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    value={nomorKamar}
                                    onChangeText={setNomorKamar}
                                    placeholder="cth: A1"
                                    placeholderTextColor="#9ca3af"
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-dark"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="mb-1.5 text-xs font-semibold text-dark">
                                    Luas Kamar <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    value={luasKamar}
                                    onChangeText={setLuasKamar}
                                    placeholder="cth: 3x4 meter"
                                    placeholderTextColor="#9ca3af"
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-dark"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="mb-1.5 text-xs font-semibold text-dark">
                                Harga / Bulan <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                value={harga}
                                onChangeText={setHarga}
                                placeholder="cth: 1000000"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-dark"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="mb-1.5 text-xs font-semibold text-dark">
                                Status Kamar <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row gap-2">
                                {STATUS_OPTIONS.map((opt) => (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => setStatus(opt.value)}
                                        style={
                                            status === opt.value
                                                ? { backgroundColor: opt.color, borderColor: opt.color }
                                                : {}
                                        }
                                        className={`flex-1 items-center rounded-xl border py-2.5 ${
                                            status === opt.value ? "" : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-semibold ${
                                                status === opt.value ? "text-white" : "text-gray-500"
                                            }`}
                                        >
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="mb-1.5 text-xs font-semibold text-dark">
                                Fasilitas Kamar <Text className="text-red-500">*</Text>
                            </Text>
                            <TextInput
                                value={fasilitas}
                                onChangeText={setFasilitas}
                                placeholder="cth: AC, Kasur, WiFi, Lemari"
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-dark"
                                style={{ minHeight: 72 }}
                            />
                            <Text className="mt-1 text-[10px] text-gray-400">
                                Pisahkan setiap fasilitas dengan koma. cth: AC, Kasur, WiFi
                            </Text>
                        </View>

                        <View>
                            <Text className="mb-1.5 text-xs font-semibold text-dark">
                                Foto Kamar
                            </Text>
                            {fotoPreview ? (
                                <View>
                                    <Image
                                        source={{ uri: fotoPreview }}
                                        className="w-full rounded-xl"
                                        style={{ height: 180 }}
                                        resizeMode="cover"
                                    />
                                    <Pressable
                                        onPress={handlePilihFoto}
                                        className="mt-2 items-center rounded-xl border border-blue-300 py-2.5 active:opacity-70"
                                        style={{ backgroundColor: "#eff6ff" }}
                                    >
                                        <Text className="text-xs font-semibold text-primary">
                                            🔄 Ganti Foto
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Pressable
                                    onPress={handlePilihFoto}
                                    className="items-center justify-center rounded-xl border border-dashed border-blue-300 py-8 active:opacity-70"
                                    style={{ backgroundColor: "#eff6ff" }}
                                >
                                    <Text className="text-3xl">☁️</Text>
                                    <Text className="mt-2 text-sm font-semibold text-primary">
                                        Klik untuk upload
                                    </Text>
                                    <Text className="mt-0.5 text-xs text-gray-400">
                                        PNG, JPG, JPEG maks. 2MB
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </ScrollView>

                <View
                    className="flex-row gap-3 border-t border-gray-200 bg-white px-4 pt-3"
                    style={{ paddingBottom: Math.max(insets.bottom, 12), elevation: 8 }}
                >
                    <Pressable
                        onPress={() => router.back()}
                        className="flex-1 items-center rounded-xl border border-gray-200 py-3 active:opacity-70"
                    >
                        <Text className="text-sm font-semibold text-gray-700">Batal</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleSimpan}
                        disabled={loading}
                        className="flex-[2] items-center rounded-xl bg-primary py-3 active:opacity-80"
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="text-sm font-bold text-white">+ Simpan Kamar</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </ProtectedRoute>
    );
}