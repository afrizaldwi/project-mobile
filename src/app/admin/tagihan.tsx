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
import { AdminSummaryCard } from "@/components/invoice/AdminSummaryCard";
import { AdminInvoiceCard } from "@/components/invoice/AdminInvoiceCard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (value: string | number | null | undefined) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

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
                    <AdminSummaryCard
                        label="Total Invoice"
                        value={isLoading ? "-" : String(summary.totalInvoice)}
                        icon="🧾"
                        color="#6366f1"
                    />
                    <AdminSummaryCard
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
                        <AdminInvoiceCard
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