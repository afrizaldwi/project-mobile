import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { InvoiceItem } from "@/api/invoice";
import { InvoicePdfFactory } from "@/utils/InvoicePdfFactory";

interface InvoiceCardProps {
    invoice: InvoiceItem;
}

const formatRupiah = (value: number | undefined) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
};

const formatDate = (value: string | undefined) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePdf = async () => {
        try {
            setIsGenerating(true);
            const html = InvoicePdfFactory.generateHtml(invoice);
            
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: 'Unduh Invoice PDF'
                });
            } else {
                Alert.alert("Gagal", "Fitur berbagi tidak tersedia di perangkat ini.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Gagal men-generate PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <View className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between border-b border-gray-100 p-4">
                <View>
                    <Text className="text-base font-extrabold text-dark">
                        {invoice.kode_invoice || "-"}
                    </Text>
                    <Text className="text-xs font-medium text-dark/50">
                        {formatDate(invoice.tanggal_bayar ?? undefined)}
                    </Text>
                </View>
                <View className="rounded-full bg-success/10 px-3 py-1">
                    <Text className="text-[10px] font-black uppercase text-success">
                        Lunas
                    </Text>
                </View>
            </View>

            <View className="p-4">
                <View className="mb-3 flex-row items-start justify-between">
                    <View className="flex-1">
                        <Text className="font-bold text-dark">{invoice.penyewa?.nama_lengkap || "Nama Penghuni"}</Text>
                        <Text className="text-xs text-dark/50">Kamar {invoice.kamar?.nomor_kamar || "-"}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="font-black text-success">
                            {formatRupiah(Number(invoice.jumlah_bayar))}
                        </Text>
                        <Text className="text-xs capitalize text-dark/40">
                            {invoice.metode_pembayaran || "-"}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={generatePdf}
                    disabled={isGenerating}
                    className="mt-2 flex-row items-center justify-center space-x-2 rounded-xl bg-primary py-3 transition-opacity active:opacity-80 disabled:opacity-60"
                >
                    <Ionicons name="download-outline" size={18} color="white" />
                    <Text className="font-bold text-white">
                        {isGenerating ? "Memproses PDF..." : "Download Invoice PDF"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
