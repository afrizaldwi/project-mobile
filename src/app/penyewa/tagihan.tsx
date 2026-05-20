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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

type SummaryBannerProps = {
    totalInvoice: number;
    totalPaid: number;
};

function SummaryBanner({ totalInvoice, totalPaid }: SummaryBannerProps) {
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

type InvoiceCardProps = {
    invoice: InvoiceItem;
    isDownloading: boolean;
    onDownload: () => void;
};

function InvoiceCard({ invoice, isDownloading, onDownload }: InvoiceCardProps) {
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
                    <SummaryBanner totalInvoice={invoices.length} totalPaid={totalPaid} />
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
                        <InvoiceCard
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