import React from "react";
import { View, Text } from "react-native";

export type PenyewaSummaryBannerProps = {
    totalInvoice: number;
    totalPaid: number;
};

const formatRupiah = (value: string | number | null | undefined) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

export function PenyewaSummaryBanner({ totalInvoice, totalPaid }: PenyewaSummaryBannerProps) {
    return (
        <View className="flex-row gap-3 mb-5">
            <View className="flex-1 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                <Text style={{ fontSize: 18 }} className="mb-1">🧾</Text>
                <Text className="text-xl font-black text-dark">{totalInvoice}</Text>
                <Text className="text-xs font-bold text-dark/40">Total Invoice</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                <Text style={{ fontSize: 18 }} className="mb-1">📄</Text>
                <Text className="text-xl font-black text-dark">{formatRupiah(totalPaid)}</Text>
                <Text className="text-xs font-bold text-dark/40">Total Dibayar</Text>
            </View>
        </View>
    );
}
