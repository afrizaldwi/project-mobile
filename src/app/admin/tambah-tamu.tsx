import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { apiClient } from "@/api/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface PenghuniAktif {
    id_user: number;
    nama_penghuni: string;
    email: string;
    nomor_kamar: string;
}

export default function AdminTambahTamuScreen() {
    const router = useRouter();
    const [nama, setNama] = useState("");
    const [noHp, setNoHp] = useState("");
    const [keperluan, setKeperluan] = useState("");
    const [idUser, setIdUser] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [penghuniList, setPenghuniList] = useState<PenghuniAktif[]>([]);
    const [loadingPenghuni, setLoadingPenghuni] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchPenghuniAktif = async () => {
            try {
                const response = await apiClient.get<{ data: PenghuniAktif[] }>("/admin/tamu/penghuni-aktif");
                setPenghuniList(response.data.data);
            } catch (error) {
                console.error("Failed to fetch penghuni:", error);
            } finally {
                setLoadingPenghuni(false);
            }
        };

        fetchPenghuniAktif();
    }, []);

    const selectedPenghuni = penghuniList.find((p) => p.id_user === idUser);

    const handleSubmit = async () => {
        if (!nama.trim() || !noHp.trim() || !keperluan.trim() || !idUser) {
            Alert.alert("Validasi Error", "Semua kolom dan penghuni yang dituju wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post("/admin/tamu", {
                nama_tamu: nama,
                no_hp_tamu: noHp,
                keperluan: keperluan,
                id_user: idUser,
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
        <ProtectedRoute allowedRoles={["admin"]}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView className="flex-1 bg-secondary">
                    <View className="px-6 py-4">
                        <Text className="text-3xl font-extrabold text-dark">Tambah Tamu</Text>
                        <Text className="text-sm text-gray-500">Catat kunjungan tamu untuk penghuni</Text>
                    </View>

                    <View className="px-6 pb-12">
                        <View className="mb-4">
                            <Text className="mb-2 text-sm font-bold text-gray-700">Penghuni yang Dikunjungi</Text>
                            <Pressable
                                onPress={() => setModalVisible(true)}
                                className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
                            >
                                <Text className={`text-base ${selectedPenghuni ? "text-dark" : "text-gray-400"}`}>
                                    {selectedPenghuni 
                                        ? `${selectedPenghuni.nama_penghuni} (Kamar ${selectedPenghuni.nomor_kamar})` 
                                        : "Pilih Penghuni Aktif..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                            </Pressable>
                        </View>

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
                                placeholder="Contoh: Mengantar paket..."
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

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="h-2/3 rounded-t-3xl bg-white p-6">
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-dark">Pilih Penghuni</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1f2938" />
                            </Pressable>
                        </View>

                        {loadingPenghuni ? (
                            <ActivityIndicator size="large" color="#2563eb" className="mt-10" />
                        ) : (
                            <FlatList
                                data={penghuniList}
                                keyExtractor={(item) => item.id_user.toString()}
                                renderItem={({ item }) => (
                                    <Pressable
                                        onPress={() => {
                                            setIdUser(item.id_user);
                                            setModalVisible(false);
                                        }}
                                        className="mb-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
                                    >
                                        <Text className="font-bold text-dark">{item.nama_penghuni}</Text>
                                        <Text className="text-sm text-gray-500">
                                            Kamar: <Text className="font-semibold text-primary">{item.nomor_kamar}</Text>
                                        </Text>
                                    </Pressable>
                                )}
                                ListEmptyComponent={
                                    <Text className="mt-10 text-center text-gray-500">
                                        Tidak ada penghuni aktif yang ditemukan.
                                    </Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </ProtectedRoute>
    );
}
