import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { PenghuniCommand } from "@/api/penghuniService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PerpanjanganSewaBuilder } from "@/types/penghuni";

function formatRupiah(angka: number): string {
    return "Rp " + Number(angka).toLocaleString("id-ID");
}

function formatTanggalDisplay(tanggal: string): string {
    if (!tanggal) return "-";
    const tgl = new Date(tanggal);
    return tgl.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function PerpanjangSewaScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id_sewa: string;
        nama: string;
        nomor_kamar: string;
        tanggal_masuk: string;
        tanggal_keluar: string;
        harga_bulanan: string;
    }>();

    const [durasi, setDurasi] = useState(1);
    const [loading, setLoading] = useState(false);

    const harga = Number(params.harga_bulanan ?? 0);
    const tanggalKeluar = params.tanggal_keluar ?? "";

    const builder = new PerpanjanganSewaBuilder()
        .setTanggalMulai(tanggalKeluar)
        .setDurasi(durasi)
        .setHargaBulanan(harga);

    const totalTagihan = builder.hitungTotal();
    const estimasiKeluar = builder.hitungEstimasi();

    function tambahDurasi() {
        if (durasi < 24) setDurasi(durasi + 1);
    }

    function kurangDurasi() {
        if (durasi > 1) setDurasi(durasi - 1);
    }

    async function handleSimpan() {
        setLoading(true);
        try {
            const payload = builder.build();
            await PenghuniCommand.perpanjang(Number(params.id_sewa), payload);
            Alert.alert(
                "Berhasil",
                "Perpanjangan sewa berhasil disimpan.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? "Terjadi kesalahan. Coba lagi.";
            Alert.alert("Gagal", msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScrollView className="flex-1 px-4 pt-4">
                    <Text className="mb-1 text-xs text-primary">
                        Data Penghuni › Perpanjang Sewa
                    </Text>
                    <Text className="text-xl font-extrabold text-dark">
                        Perpanjang Sewa
                    </Text>
                    <Text className="mb-4 text-sm text-gray-500">
                        {params.nama} — Kamar {params.nomor_kamar}
                    </Text>

                    <View className="mb-3 flex-row gap-3">
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Nama Penghuni
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {params.nama}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Nomor Kamar
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {params.nomor_kamar}
                            </Text>
                        </View>
                    </View>
                    <View className="mb-4 flex-row gap-3">
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Tanggal Masuk
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {formatTanggalDisplay(params.tanggal_masuk)}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Tgl Keluar Saat Ini
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {formatTanggalDisplay(tanggalKeluar)}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
                        <Text className="mb-4 text-sm font-bold text-dark">
                            Detail Perpanjangan
                        </Text>

                        <View className="mb-3 flex-row gap-3">
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">
                                    Tanggal Mulai{" "}
                                    <Text className="text-danger">*</Text>
                                </Text>
                                <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                    <Text className="text-sm text-gray-500">
                                        {formatTanggalDisplay(tanggalKeluar)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">
                                    Durasi (Bulan){" "}
                                    <Text className="text-danger">*</Text>
                                </Text>
                                <View className="flex-row items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <TouchableOpacity
                                        onPress={kurangDurasi}
                                        className="items-center justify-center bg-gray-100 px-4 py-3"
                                    >
                                        <Text className="text-base font-bold text-dark">
                                            −
                                        </Text>
                                    </TouchableOpacity>
                                    <View className="flex-1 items-center justify-center">
                                        <Text className="text-sm font-bold text-dark">
                                            {durasi}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={tambahDurasi}
                                        className="items-center justify-center bg-gray-100 px-4 py-3"
                                    >
                                        <Text className="text-base font-bold text-dark">
                                            +
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="mb-4 flex-row gap-3">
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">
                                    Harga Bulanan
                                </Text>
                                <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                    <Text className="text-sm text-gray-500">
                                        {formatRupiah(harga)}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">
                                    Estimasi Tgl Keluar Baru
                                </Text>
                                <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                    <Text className="text-sm text-gray-500">
                                        {estimasiKeluar}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="rounded-xl bg-blue-50 p-4">
                            <Text className="mb-1 text-xs font-semibold text-primary">
                                Total Tagihan Perpanjangan
                            </Text>
                            <Text className="text-2xl font-extrabold text-primary">
                                {formatRupiah(totalTagihan)}
                            </Text>
                            <Text className="mt-1 text-xs text-blue-400">
                                {formatRupiah(harga)} × {durasi} bulan
                            </Text>
                        </View>
                    </View>

                    <View className="mb-8 flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="flex-1 items-center rounded-xl border border-gray-300 bg-white py-3"
                        >
                            <Text className="text-sm font-bold text-gray-600">
                                Batal
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSimpan}
                            disabled={loading}
                            className={`flex-[2] items-center rounded-xl py-3 ${
                                !loading ? "bg-primary" : "bg-gray-300"
                            }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-sm font-bold text-white">
                                    ↻ Simpan Perpanjangan
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </ProtectedRoute>
    );
}