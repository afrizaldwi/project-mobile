import { InvoiceListItemResponse } from "@/types/invoice";
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export type AdminInvoiceCardProps = {
    invoice: InvoiceListItemResponse;
    isDownloading: boolean;
    onDownload: () => void;
};

const formatRupiah = (value: string | number | null | undefined) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export function AdminInvoiceCard({ invoice, isDownloading, onDownload }: AdminInvoiceCardProps) {
    return (
        <View className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm mb-3">
            {/* Header baris */}
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-3">
                    <Text className="text-xs font-black text-dark/40 uppercase tracking-wide">
                        {invoice.kode_invoice || "-"}
                    </Text>
                    <Text className="font-black text-dark text-base mt-0.5" numberOfLines={1}>
                        {invoice.penyewa.nama_lengkap || "-"}
                    </Text>
                    <Text className="text-xs text-dark/40 font-medium">
                        {invoice.penyewa.email || "-"}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="font-black text-green-600 text-sm">
                        {formatRupiah(invoice.jumlah_bayar)}
                    </Text>
                    <View className="mt-1 flex-row items-center rounded-full bg-green-100 px-2 py-0.5">
                        <Text className="text-[10px] font-black text-green-700 uppercase">
                            ✓ Diterima
                        </Text>
                    </View>
                </View>
            </View>

            {/* Detail info */}
            <View className="rounded-xl bg-gray-50 p-3 mb-3">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-dark/40 font-medium">Kamar</Text>
                    <Text className="text-xs font-bold text-dark">
                        {invoice.kamar.nomor_kamar || "-"}
                    </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-dark/40 font-medium">Tanggal Bayar</Text>
                    <Text className="text-xs font-bold text-dark">
                        {formatDate(invoice.tanggal_bayar)}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-xs text-dark/40 font-medium">Metode</Text>
                    <Text className="text-xs font-bold text-dark capitalize">
                        {invoice.metode_pembayaran || "-"}
                    </Text>
                </View>
            </View>

            {/* Tombol download */}
            <TouchableOpacity
                onPress={onDownload}
                disabled={isDownloading}
                className="flex-row items-center justify-center rounded-xl bg-primary py-3"
                style={{ opacity: isDownloading ? 0.6 : 1 }}
                activeOpacity={0.8}
            >
                {isDownloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text className="text-white font-black text-sm">⬇ Download PDF</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
