// src/app/penyewa/tagihan.tsx
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { invoiceApi, type InvoiceItem } from "@/api/invoice";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PenyewaSummaryBanner } from "@/components/invoice/PenyewaSummaryBanner";
import { PenyewaInvoiceCard } from "@/components/invoice/PenyewaInvoiceCard";

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PenyewaTagihanScreen() {
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const totalPaid = useMemo(
        () => invoices.reduce((total, inv) => total + Number(inv.jumlah_bayar || 0), 0),
        [invoices]
    );

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const data = await invoiceApi.getPenyewaInvoices();
            setInvoices(data);
        } catch {
            setErrorMessage("Gagal memuat data tagihan.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleDownloadPdf = async (invoice: InvoiceItem) => {
        try {
            setDownloadingId(invoice.id_pembayaran);
            await invoiceApi.downloadPenyewaInvoicePdf(
                invoice.id_pembayaran,
                invoice.kode_invoice ?? "invoice"
            );
        } catch {
            Alert.alert("Gagal", "Tidak bisa download PDF. Coba lagi.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <ScrollView
                className="flex-1 bg-secondary"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-5">
                    <Text className="text-2xl font-black text-dark">Tagihan Saya</Text>
                    <Text className="text-sm font-medium text-dark/50 mt-1">
                        Lihat riwayat pembayaran dan download invoice kost.
                    </Text>
                </View>

                {/* Error */}
                {errorMessage ? (
                    <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <Text className="text-sm font-semibold text-red-600">{errorMessage}</Text>
                    </View>
                ) : null}

                {/* Summary */}
                {!isLoading && (
                    <PenyewaSummaryBanner totalInvoice={invoices.length} totalPaid={totalPaid} />
                )}

                {/* Section Header */}
                <View className="mb-3">
                    <Text className="text-lg font-black text-dark">Riwayat Pembayaran</Text>
                    <Text className="text-xs font-medium text-dark/40">
                        Invoice tersedia setelah pembayaran diterima admin.
                    </Text>
                </View>

                {/* List */}
                {isLoading ? (
                    <View className="items-center py-12">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="mt-3 text-sm font-medium text-dark/50">
                            Memuat data tagihan...
                        </Text>
                    </View>
                ) : invoices.length === 0 ? (
                    <View className="items-center rounded-2xl bg-white py-12 border border-gray-100 shadow-sm">
                        <Text className="text-4xl mb-3">✅</Text>
                        <Text className="font-black text-dark">Belum ada invoice</Text>
                        <Text className="mt-1 text-sm font-medium text-dark/50 text-center px-6">
                            Invoice akan muncul setelah pembayaran kamu diterima admin.
                        </Text>
                    </View>
                ) : (
                    invoices.map((invoice) => (
                        <PenyewaInvoiceCard
                            key={invoice.id_pembayaran}
                            invoice={invoice}
                            isDownloading={downloadingId === invoice.id_pembayaran}
                            onDownload={() => handleDownloadPdf(invoice)}
                        />
                    ))
                )}
            </ScrollView>
        </ProtectedRoute>
    );
}