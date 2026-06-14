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

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePerpanjangSewa } from "@/hooks/usePerpanjangSewa";
import { formatRupiah } from "@/utils/format";

function formatTanggalDisplay(tanggal?: string | null): string {
    if (!tanggal || tanggal === "—" || tanggal === "-") return "-";
    const tgl = new Date(tanggal);
    if (Number.isNaN(tgl.getTime())) return "-";
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
    const [confirming, setConfirming] = useState(false);

    const idSewa = Number(params.id_sewa);

    const {
        durasi, loading, isLoadingDetail, detailError,
        nama, nomorKamar, tanggalMasuk, tanggalKeluar, harga,
        totalTagihan, estimasiKeluar,
        tambahDurasi, kurangDurasi, handleSimpan,
    } = usePerpanjangSewa(
        idSewa,
        Number(params.harga_bulanan ?? 0),
        params.tanggal_keluar,
    );

    const displayNama = nama || params.nama || "-";
    const displayNomorKamar = nomorKamar || params.nomor_kamar || "-";
    const displayTanggalMasuk = tanggalMasuk || params.tanggal_masuk || "";
    const displayTanggalKeluar = tanggalKeluar || params.tanggal_keluar || "";
    const displayHarga = harga || Number(params.harga_bulanan ?? 0);

    async function onSimpan() {
        Alert.alert(
            "Konfirmasi Perpanjangan",
            `Perpanjang sewa ${durasi} bulan?\nTotal tagihan: ${formatRupiah(totalTagihan)}`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Perpanjang",
                    onPress: async () => {
                        setConfirming(true);
                        try {
                            const result = await handleSimpan();
                            if (result?.error) {
                                Alert.alert(result.error, result.message);
                            } else if (result?.success) {
                                Alert.alert("Berhasil", result.message, [
                                    { text: "OK", onPress: () => router.replace("/admin/penghuni") },
                                ]);
                            }
                        } finally {
                            setConfirming(false);
                        }
                    },
                },
            ]
        );
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
                        {displayNama} — Kamar {displayNomorKamar}
                    </Text>

                    {isLoadingDetail ? (
                        <View className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <Text className="text-xs font-semibold text-primary">Memuat detail sewa terbaru...</Text>
                        </View>
                    ) : null}

                    {detailError ? (
                        <View className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                            <Text className="text-xs font-semibold text-yellow-700">
                                {detailError}
                            </Text>
                        </View>
                    ) : null}

                    <View className="mb-3 flex-row gap-3">
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">Nama Penghuni</Text>
                            <Text className="text-sm font-bold text-dark">{displayNama}</Text>
                        </View>
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">Nomor Kamar</Text>
                            <Text className="text-sm font-bold text-dark">{displayNomorKamar}</Text>
                        </View>
                    </View>
                    <View className="mb-4 flex-row gap-3">
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">Tanggal Masuk</Text>
                            <Text className="text-sm font-bold text-dark">
                                {formatTanggalDisplay(displayTanggalMasuk)}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">Tgl Keluar Saat Ini</Text>
                            <Text className="text-sm font-bold text-dark">
                                {formatTanggalDisplay(displayTanggalKeluar)}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
                        <Text className="mb-4 text-sm font-bold text-dark">Detail Perpanjangan</Text>

                        <View className="mb-3 flex-row gap-3">
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">
                                    Tanggal Mulai <Text className="text-danger">*</Text>
                                </Text>
                                <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                    <Text className="text-sm text-gray-500">
                                        {formatTanggalDisplay(displayTanggalKeluar)}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">
                                    Durasi (Bulan) <Text className="text-danger">*</Text>
                                </Text>
                                <View className="flex-row items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <TouchableOpacity
                                        onPress={kurangDurasi}
                                        className="items-center justify-center bg-gray-100 px-4 py-3"
                                    >
                                        <Text className="text-base font-bold text-dark">−</Text>
                                    </TouchableOpacity>
                                    <View className="flex-1 items-center justify-center">
                                        <Text className="text-sm font-bold text-dark">{durasi}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={tambahDurasi}
                                        className="items-center justify-center bg-gray-100 px-4 py-3"
                                    >
                                        <Text className="text-base font-bold text-dark">+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="mb-4 flex-row gap-3">
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">Harga Bulanan</Text>
                                <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                    <Text className="text-sm text-gray-500">
                                        {formatRupiah(displayHarga)}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="mb-1 text-xs text-gray-500">Estimasi Tgl Keluar Baru</Text>
                                <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                                    <Text className="text-sm text-gray-500">{estimasiKeluar}</Text>
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
                                {formatRupiah(displayHarga)} × {durasi} bulan
                            </Text>
                        </View>
                    </View>

                    <View className="mb-8 flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="flex-1 items-center rounded-xl border border-gray-300 bg-white py-3"
                        >
                            <Text className="text-sm font-bold text-gray-600">Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onSimpan}
                            disabled={loading || confirming}
                            className={`flex-[2] items-center rounded-xl py-3 ${
                                !loading && !confirming ? "bg-primary" : "bg-gray-300"
                            }`}
                        >
                            {loading || confirming ? (
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
