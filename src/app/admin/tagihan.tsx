// src/app/admin/tagihan.tsx
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
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
        month: "short",
        year: "numeric",
    });
};

// ─── Sub-components (design pattern: presentational components) ───────────────

type SummaryCardProps = {
    label: string;
    value: string;
    icon: string;
    color: string;
};

function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
    return (
        <View className="flex-1 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <View
                className="mb-2 h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}18` }}
            >
                <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <Text className="text-xl font-black text-dark">{value}</Text>
            <Text className="text-xs font-bold text-dark/40 mt-0.5">{label}</Text>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminTagihanScreen() {
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const filteredInvoices = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        if (!keyword) return invoices;
        return invoices.filter(
            (inv) =>
                inv.kode_invoice?.toLowerCase().includes(keyword) ||
                inv.penyewa.nama_lengkap?.toLowerCase().includes(keyword) ||
                inv.kamar.nomor_kamar?.toLowerCase().includes(keyword) ||
                inv.metode_pembayaran?.toLowerCase().includes(keyword)
        );
    }, [invoices, search]);

    const summary = useMemo(() => ({
        totalInvoice: invoices.length,
        totalPembayaran: invoices.reduce(
            (total, inv) => total + Number(inv.jumlah_bayar || 0),
            0
        ),
    }), [invoices]);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const data = await invoiceApi.getAdminInvoices();
            setInvoices(data);
        } catch {
            setErrorMessage("Gagal memuat data invoice.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleDownloadPdf = async (invoice: InvoiceItem) => {
        try {
            setDownloadingId(invoice.id_pembayaran);
            await invoiceApi.downloadAdminInvoicePdf(
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
        <ProtectedRoute allowedRoles={["admin"]}>
            <ScrollView
                className="flex-1 bg-secondary"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-5">
                    <Text className="text-2xl font-black text-dark">Manajemen Tagihan</Text>
                    <Text className="text-sm font-medium text-dark/50 mt-1">
                        Kelola invoice pembayaran yang sudah diterima.
                    </Text>
                </View>

                {/* Error */}
                {errorMessage ? (
                    <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <Text className="text-sm font-semibold text-red-600">{errorMessage}</Text>
                    </View>
                ) : null}

                {/* Summary Cards */}
                <View className="flex-row gap-3 mb-5">
                    <SummaryCard
                        label="Total Invoice"
                        value={isLoading ? "-" : String(summary.totalInvoice)}
                        icon="🧾"
                        color="#6366f1"
                    />
                    <SummaryCard
                        label="Total Pembayaran"
                        value={isLoading ? "-" : formatRupiah(summary.totalPembayaran)}
                        icon="✅"
                        color="#22c55e"
                    />
                </View>

                {/* Search */}
                <View className="mb-4 flex-row items-center rounded-xl bg-white border border-gray-200 px-3 py-2.5">
                    <Text className="mr-2 text-dark/30">🔍</Text>
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Cari invoice, penyewa, kamar..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 text-sm font-medium text-dark"
                    />
                </View>

                {/* Invoice Section Header */}
                <View className="mb-3">
                    <Text className="text-lg font-black text-dark">Invoice Transaksi</Text>
                    <Text className="text-xs font-medium text-dark/40">
                        Data dari pembayaran dengan status diterima
                    </Text>
                </View>

                {/* List */}
                {isLoading ? (
                    <View className="items-center py-12">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="mt-3 text-sm font-medium text-dark/50">
                            Memuat data...
                        </Text>
                    </View>
                ) : filteredInvoices.length === 0 ? (
                    <View className="items-center rounded-2xl bg-white py-12 border border-gray-100">
                        <Text className="text-3xl mb-2">📄</Text>
                        <Text className="font-black text-dark">Tidak ada invoice</Text>
                        <Text className="mt-1 text-sm font-medium text-dark/40">
                            {search ? "Coba kata kunci lain" : "Belum ada data invoice"}
                        </Text>
                    </View>
                ) : (
                    filteredInvoices.map((invoice) => (
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