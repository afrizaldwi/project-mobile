import { useEffect, useState } from "react";
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

import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatTanggal, getImageUrl, getKamarById, updateKamar } from "@/api/kamarService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { markKamarCacheDirty } from "@/database/kamarRepository";
import type { FotoPayload, KamarPayload, KamarStatus } from "@/types/kamar";
import { KAMAR_STATUS_OPTIONS } from "@/types/kamar";
import { requireOnlineAction } from "@/utils/offlineUi";
import { imageAssetToUploadFile } from "@/utils/uploadFile";

export default function KamarEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const kamarId = parseInt(id ?? "0", 10);
    const insets = useSafeAreaInsets();
    const db = useSQLiteContext();

    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);

    const [nomorKamar, setNomorKamar] = useState("");
    const [luasKamar, setLuasKamar] = useState("");
    const [fasilitas, setFasilitas] = useState("");
    const [harga, setHarga] = useState("");
    const [status, setStatus] = useState<KamarStatus>("tersedia");
    const [createdAt, setCreatedAt] = useState("");
    const [updatedAt, setUpdatedAt] = useState("");
    const [existingFoto, setExistingFoto] = useState<string | null>(null);
    const [foto, setFoto] = useState<FotoPayload | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const kamar = await getKamarById(kamarId);
                setNomorKamar(kamar.nomor_kamar);
                setLuasKamar(kamar.luas_kamar);
                setFasilitas(kamar.fasilitas);
                setHarga(kamar.harga_bulanan);
                setStatus(kamar.status_kamar);
                setCreatedAt(kamar.created_at);
                setUpdatedAt(kamar.updated_at);
                setExistingFoto(getImageUrl(kamar.foto_kamar));
                setImageError(false);
            } catch {
                Alert.alert("Error", "Gagal memuat data kamar.");
                router.back();
            } finally {
                setLoadingData(false);
            }
        };
        if (kamarId) load();
    }, [kamarId]);

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
            setFotoPreview(asset.uri);
            setFoto(imageAssetToUploadFile(asset, "foto_kamar"));
            setImageError(false);
        }
    };

    const handleSimpan = async () => {
        if (!nomorKamar.trim() || !luasKamar.trim() || !harga.trim() || !fasilitas.trim()) {
            Alert.alert("Validasi", "Semua field wajib diisi.");
            return;
        }
        const hargaValue = harga.trim();
        if (!/^\d+(?:\.\d+)?$/.test(hargaValue) || !/[1-9]/.test(hargaValue)) {
            Alert.alert("Validasi", "Harga harus berupa angka yang valid.");
            return;
        }
        if (!(await requireOnlineAction())) return;

        Alert.alert(
            "Konfirmasi",
            "Apakah Anda yakin ingin menyimpan perubahan kamar ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Simpan",
                    onPress: async () => {
                        if (!(await requireOnlineAction())) return;

                        const payload: KamarPayload = {
                            nomor_kamar: nomorKamar.trim(),
                            luas_kamar: luasKamar.trim(),
                            fasilitas: fasilitas.trim(),
                            harga_bulanan: hargaValue,
                            status_kamar: status,
                            ...(foto ? { foto_kamar: foto } : {}),
                        };
                        try {
                            setSaving(true);
                            await updateKamar(kamarId, payload);
                            await markKamarCacheDirty(db);
                            Alert.alert("Berhasil", "Data kamar berhasil diperbarui.", [
                                { text: "OK", onPress: () => router.back() },
                            ]);
                        } catch (e: any) {
                            const msg = e?.response?.data?.message ?? "Gagal menyimpan perubahan. Coba lagi.";
                            Alert.alert("Error", msg);
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    if (loadingData) {
        return (
            <ProtectedRoute allowedRoles={["admin"]}>
                <View className="flex-1 items-center justify-center bg-secondary">
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="mt-3 text-sm text-gray-400">Memuat data kamar...</Text>
                </View>
            </ProtectedRoute>
        );
    }

    const displayFoto = fotoPreview ?? existingFoto;
    const showImage = displayFoto && !imageError;

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
                        {" › "}Edit Kamar — No. {nomorKamar}
                    </Text>

                    <Text className="mb-1 text-2xl font-extrabold text-dark">Edit Kamar</Text>
                    <Text className="mb-4 text-xs text-gray-500">
                        Perbarui detail kamar No. {nomorKamar}
                    </Text>

                    <View className="mb-4 flex-row gap-3">
                        <View className="flex-1 rounded-xl bg-white p-3" style={{ elevation: 1 }}>
                            <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                                Ditambahkan
                            </Text>
                            <Text className="mt-0.5 text-xs font-semibold text-dark">
                                {formatTanggal(createdAt)}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-xl bg-white p-3" style={{ elevation: 1 }}>
                            <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                                Terakhir diedit
                            </Text>
                            <Text className="mt-0.5 text-xs font-semibold text-dark">
                                {formatTanggal(updatedAt)}
                            </Text>
                        </View>
                    </View>

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
                                keyboardType="numeric"
                                placeholderTextColor="#9ca3af"
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-dark"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="mb-1.5 text-xs font-semibold text-dark">
                                Status Kamar <Text className="text-red-500">*</Text>
                            </Text>
                            <View className="flex-row gap-2">
                                {KAMAR_STATUS_OPTIONS.map((opt) => (
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
                            {showImage ? (
                                <View>
                                    <Image
                                        source={{ uri: displayFoto! }}
                                        className="w-full rounded-xl"
                                        style={{ height: 180 }}
                                        resizeMode="cover"
                                        onError={() => setImageError(true)}
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
                                        PNG, JPG hingga 10MB
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
                        disabled={saving}
                        className="flex-[2] items-center rounded-xl bg-primary py-3 active:opacity-80"
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="text-sm font-bold text-white">💾 Simpan Perubahan</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </ProtectedRoute>
    );
}
