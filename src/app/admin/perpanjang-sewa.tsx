import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { PenghuniService } from "@/api/penghuniService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { markPenghuniCacheDirty } from "@/database/penghuniRepository";
import { synchronizePenghuniCache } from "@/database/penghuniSync";
import { getConnectivityStatus } from "@/network/connectivity";
import { PerpanjanganSewaBuilder, type Penghuni as SewaExtensionDetail } from "@/types/penghuni";

function formatRupiah(angka: number): string {
    return "Rp " + Number(angka).toLocaleString("id-ID");
}

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

function getValidationMessage(error: any): string {
    const errors = error?.response?.data?.errors;
    if (errors) {
        const firstError = Object.values(errors)[0] as string[] | undefined;
        if (firstError?.[0]) return firstError[0];
    }

    return error?.response?.data?.message || error?.message || "Terjadi kesalahan. Coba lagi.";
}

export default function PerpanjangSewaScreen() {
    const router = useRouter();
    const db = useSQLiteContext();
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
    const [isLoadingDetail, setIsLoadingDetail] = useState(true);
    const [detail, setDetail] = useState<SewaExtensionDetail | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);

    const idSewa = Number(params.id_sewa);

    useEffect(() => {
        if (!idSewa) {
            setDetailError("ID sewa tidak valid.");
            setIsLoadingDetail(false);
            return;
        }

        let isMounted = true;

        PenghuniService.fetchDetail(idSewa)
            .then((data) => {
                if (!isMounted) return;
                setDetail(data);
                setDetailError(null);
            })
            .catch((error: any) => {
                if (!isMounted) return;
                setDetailError(getValidationMessage(error));
            })
            .finally(() => {
                if (isMounted) setIsLoadingDetail(false);
            });

        return () => {
            isMounted = false;
        };
    }, [idSewa]);

    const nama = detail?.nama || params.nama || "-";
    const nomorKamar = detail?.nomor_kamar || params.nomor_kamar || "-";
    const tanggalMasuk = detail?.tanggal_masuk || params.tanggal_masuk || "";
    const tanggalKeluar = detail?.tanggal_keluar || params.tanggal_keluar || "";
    const harga = Number(detail?.harga_bulanan ?? params.harga_bulanan ?? 0);

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
        if (await getConnectivityStatus() === "offline") {
            Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet.");
            return;
        }
        if (!idSewa) {
            Alert.alert("Gagal", "ID sewa tidak valid.");
            return;
        }

        if (!tanggalKeluar || tanggalKeluar === "—" || tanggalKeluar === "-") {
            Alert.alert("Gagal", "Tanggal keluar sewa saat ini tidak tersedia.");
            return;
        }

        if (!harga || harga <= 0) {
            Alert.alert("Gagal", "Harga bulanan kamar tidak valid.");
            return;
        }

        setLoading(true);
        try {
            const payload = builder.build();
            const response = await PenghuniService.perpanjang(idSewa, payload);
            try {
                await markPenghuniCacheDirty(db);
                await synchronizePenghuniCache(db);
            } catch (cacheError) {
                console.error("Failed to refresh PENGHUNI cache after extension:", cacheError);
            }
            Alert.alert(
                "Berhasil",
                response?.message || "Sewa berhasil diperpanjang dan tagihan baru berhasil dibuat.",
                [{ text: "OK", onPress: () => router.replace("/admin/penghuni") }]
            );
        } catch (err: any) {
            Alert.alert("Gagal", getValidationMessage(err));
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
                        {nama} — Kamar {nomorKamar}
                    </Text>

                    {isLoadingDetail ? (
                        <View className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <Text className="text-xs font-semibold text-primary">Memuat detail sewa terbaru...</Text>
                        </View>
                    ) : null}

                    {detailError ? (
                        <View className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                            <Text className="text-xs font-semibold text-yellow-700">
                                {detail ? detailError : "Detail sewa tidak dapat dimuat. " + detailError}
                            </Text>
                        </View>
                    ) : null}

                    <View className="mb-3 flex-row gap-3">
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Nama Penghuni
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {nama}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Nomor Kamar
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {nomorKamar}
                            </Text>
                        </View>
                    </View>
                    <View className="mb-4 flex-row gap-3">
                        <View className="flex-1 rounded-xl border border-gray-200 bg-white p-3">
                            <Text className="mb-1 text-xs text-gray-400">
                                Tanggal Masuk
                            </Text>
                            <Text className="text-sm font-bold text-dark">
                                {formatTanggalDisplay(tanggalMasuk)}
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
                            disabled={loading || isLoadingDetail}
                            className={`flex-[2] items-center rounded-xl py-3 ${
                                !loading && !isLoadingDetail ? "bg-primary" : "bg-gray-300"
                            }`}
                        >
                            {loading || isLoadingDetail ? (
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