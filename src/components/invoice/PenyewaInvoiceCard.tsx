import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import type { InvoiceItem } from "@/api/invoice";

export type PenyewaInvoiceCardProps = {
    invoice: InvoiceItem;
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
        month: "long",
        year: "numeric",
    });
};

export function PenyewaInvoiceCard({ invoice, isDownloading, onDownload }: PenyewaInvoiceCardProps) {
    return (
        <View className="mb-4 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            {/* Header */}
            <View className="flex-row items-start justify-between mb-4">
                <View>
                    <Text className="text-xs font-black uppercase tracking-wide text-dark/40">
                        {invoice.kode_invoice || "-"}
                    </Text>
                    <Text className="mt-1 text-lg font-black text-dark">
                        Kamar {invoice.kamar.nomor_kamar || "-"}
                    </Text>
                </View>
                <View className="flex-row items-center rounded-full bg-green-100 px-3 py-1">
                    <Text className="text-[10px] font-black uppercase text-green-700">
                        ✓ Lunas
                    </Text>
                </View>
            </View>

            {/* Detail Grid */}
            <View className="rounded-xl bg-gray-50 p-4 mb-4">
                <View className="flex-row mb-3">
                    <View className="flex-1">
                        <Text className="text-xs font-bold uppercase text-dark/40 mb-1">
                            Total Dibayar
                        </Text>
                        <Text className="text-xl font-black text-dark">
                            {formatRupiah(invoice.jumlah_bayar)}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-bold uppercase text-dark/40 mb-1">
                            Tanggal Bayar
                        </Text>
                        <Text className="font-black text-dark text-sm">
                            {formatDate(invoice.tanggal_bayar)}
                        </Text>
                    </View>
                </View>
                <View className="flex-row">
                    <View className="flex-1">
                        <Text className="text-xs font-bold uppercase text-dark/40 mb-1">
                            Jatuh Tempo
                        </Text>
                        <Text className="font-black text-dark text-sm">
                            {formatDate(invoice.tanggal_jatuh_tempo)}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-bold uppercase text-dark/40 mb-1">
                            Metode
                        </Text>
                        <Text className="font-black text-dark capitalize text-sm">
                            {invoice.metode_pembayaran || "-"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Download Button */}
            <TouchableOpacity
                onPress={onDownload}
                disabled={isDownloading}
                className="flex-row items-center justify-center rounded-xl bg-primary py-3.5"
                style={{ opacity: isDownloading ? 0.6 : 1 }}
                activeOpacity={0.8}
            >
                {isDownloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text className="text-white font-black">⬇ Download Invoice PDF</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
