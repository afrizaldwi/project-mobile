// src/app/admin/laporan.tsx
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { exportCsvToShare, invoiceApi, type InvoiceItem } from "@/api/invoice";
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

// ─── Sub-components ───────────────────────────────────────────────────────────

type StatCardProps = {
    icon: string;
    label: string;
    value: string;
    bgColor: string;
};

function StatCard({ icon, label, value, bgColor }: StatCardProps) {
    return (
        <View className="flex-1 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
            <View
                className="mb-2 h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: bgColor }}
            >
                <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <Text className="text-xl font-black text-dark">{value}</Text>
            <Text className="text-xs font-bold text-dark/40 mt-0.5">{label}</Text>
        </View>
    );
}

type TransactionRowProps = { invoice: InvoiceItem };

function TransactionRow({ invoice }: TransactionRowProps) {
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminLaporanScreen() {
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const summary = useMemo(() => {
        const totalPembayaran = invoices.reduce(
            (total, inv) => total + Number(inv.jumlah_bayar || 0),
            0
        );
        return { totalInvoice: invoices.length, totalPembayaran };
    }, [invoices]);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const data = await invoiceApi.getAdminInvoices();
            setInvoices(data);
        } catch {
            setErrorMessage("Gagal memuat data laporan transaksi.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleExportCsv = async () => {
        if (invoices.length === 0) {
            Alert.alert("Info", "Tidak ada data transaksi untuk diexport.");
            return;
        }
        try {
            setIsExporting(true);
            await exportCsvToShare(invoices);
        } catch (error) {
            Alert.alert("Gagal", "Tidak bisa export CSV. Coba lagi.");
        } finally {
            setIsExporting(false);
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
                <View className="mb-5 flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                        <Text className="text-2xl font-black text-dark">Laporan Keuangan</Text>
                        <Text className="text-sm font-medium text-dark/50 mt-1">
                            Export laporan transaksi pembayaran yang sudah diterima.
                        </Text>
                    </View>

                    {/* Tombol Export CSV */}
                    <TouchableOpacity
                        onPress={handleExportCsv}
                        disabled={isLoading || isExporting || invoices.length === 0}
                        className="flex-row items-center rounded-xl bg-primary px-4 py-2.5 mt-1"
                        style={{ opacity: (isLoading || isExporting || invoices.length === 0) ? 0.6 : 1 }}
                        activeOpacity={0.8}
                    >
                        {isExporting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="text-white font-black text-sm">⬇ CSV</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Error */}
                {errorMessage ? (
                    <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                        <Text className="text-sm font-semibold text-red-600">{errorMessage}</Text>
                    </View>
                ) : null}

                {/* Stat Cards */}
                <View className="flex-row gap-3 mb-5">
                    <StatCard
                        icon="🧾"
                        label="Total Invoice"
                        value={isLoading ? "-" : String(summary.totalInvoice)}
                        bgColor="#eef2ff"
                    />
                    <StatCard
                        icon="💰"
                        label="Total Diterima"
                        value={isLoading ? "-" : formatRupiah(summary.totalPembayaran)}
                        bgColor="#dcfce7"
                    />
                </View>

                {/* Export Info Card */}
                <View className="mb-5 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <Text className="font-black text-dark mb-1">Export Laporan Transaksi</Text>
                    <Text className="text-sm text-dark/50 font-medium mb-3">
                        Laporan mencakup semua pembayaran berstatus diterima dalam format CSV.
                        File bisa dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
                    </Text>
                    <View className="rounded-xl bg-gray-50 px-4 py-3">
                        <Text className="text-sm font-black text-dark/50">
                            {isLoading
                                ? "Memuat data..."
                                : `${invoices.length} transaksi siap diexport`}
                        </Text>
                    </View>
                </View>

                {/* Daftar Transaksi */}
                <View className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <Text className="font-black text-dark mb-3">Riwayat Transaksi</Text>

                    {isLoading ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="large" color="#6366f1" />
                            <Text className="mt-3 text-sm text-dark/50 font-medium">Memuat data...</Text>
                        </View>
                    ) : invoices.length === 0 ? (
                        <View className="items-center py-8">
                            <Text className="text-3xl mb-2">📊</Text>
                            <Text className="font-black text-dark">Belum ada transaksi</Text>
                            <Text className="mt-1 text-sm text-dark/40 font-medium">
                                Transaksi yang diterima akan muncul di sini
                            </Text>
                        </View>
                    ) : (
                        invoices.map((invoice) => (
                            <TransactionRow key={invoice.id_pembayaran} invoice={invoice} />
                        ))
                    )}
                </View>
            </ScrollView>
        </ProtectedRoute>
    );
}