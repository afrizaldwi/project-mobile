import { InvoiceListItemResponse } from "@/types/invoice";
import React from "react";
import { View, Text } from "react-native";

export type TransactionRowProps = {
    invoice: InvoiceListItemResponse;
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

export function TransactionRow({ invoice }: TransactionRowProps) {
    return (
        <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-1 mr-3">
                <Text className="font-black text-dark text-sm" numberOfLines={1}>
                    {invoice.penyewa.nama_lengkap || "-"}
                </Text>
                <Text className="text-xs text-dark/40 font-medium">
                    {invoice.kode_invoice || "-"} • {formatDate(invoice.tanggal_bayar)}
                </Text>
            </View>
            <View className="items-end">
                <Text className="font-black text-green-600 text-sm">
                    {formatRupiah(invoice.jumlah_bayar)}
                </Text>
                <Text className="text-[10px] text-dark/30 font-medium capitalize">
                    {invoice.metode_pembayaran || "-"}
                </Text>
            </View>
        </View>
    );
}
