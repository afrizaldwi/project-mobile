<<<<<<< HEAD
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
import { StatCard } from "@/components/laporan/StatCard";
import { TransactionRow } from "@/components/laporan/TransactionRow";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (value: string | number | null | undefined) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

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
=======
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLaporanKeuangan } from "@/hooks/useLaporanKeuangan";

// Import extracted components
import { LaporanSummaryCards } from "@/components/laporan/LaporanSummaryCards";
import { LaporanFilterModal } from "@/components/laporan/LaporanFilterModal";
import { FormTambahPengeluaran } from "@/components/laporan/FormTambahPengeluaran";
import { LaporanTables } from "@/components/laporan/LaporanTables";

export default function AdminLaporanScreen() {
    const {
        bulan,
        setBulan,
        tahun,
        setTahun,
        data,
        isLoading,
        isSubmitting,
        showExpenseForm,
        setShowExpenseForm,
        errorMessage,
        monthOptions,
        form,
        setForm,
        handleSubmitExpense,
        handleDeleteExpense,
        formatCurrency,
    } = useLaporanKeuangan();

    // Table active tab state
    const [activeTableTab, setActiveTableTab] = useState<"pengeluaran" | "pembayaran">("pengeluaran");

    // Unified filter modal state
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const activeMonthLabel = monthOptions.find((m) => m.value === bulan)?.label || "";

    const summary = data?.summary;
    const pengeluaran = data?.pengeluaran_terbaru || [];
    const pembayaran = data?.pembayaran_terbaru || [];

    const handleApplyFilter = (newBulan: number, newTahun: number) => {
        setBulan(newBulan);
        setTahun(newTahun);
    };

    const handleFormChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-light">
                {/* Header Section */}
                <View className="bg-white px-6 pt-6 pb-4 shadow-sm border-b border-gray-100 z-10">
                    <Text className="text-2xl font-black text-dark">Laporan Keuangan</Text>
                    <Text className="text-sm font-medium text-gray-500 mt-1">
                        Ringkasan transaksi dan pencatatan pengeluaran operasional.
                    </Text>
                </View>

                {/* Main Content Scroll Container */}
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Controls Bar */}
                    <View className="mx-6 mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-col gap-3">
                        <View className="flex-row gap-2 justify-between">
                            {/* Month Dropdown Button */}
                            <TouchableOpacity
                                onPress={() => setIsFilterModalOpen(true)}
                                className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
                            >
                                <Text className="text-sm font-bold text-dark">{activeMonthLabel}</Text>
                                <Ionicons name="chevron-down" size={16} color="#4b5563" />
                            </TouchableOpacity>

                            {/* Year Dropdown Button */}
                            <TouchableOpacity
                                onPress={() => setIsFilterModalOpen(true)}
                                className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
                            >
                                <Text className="text-sm font-bold text-dark">{tahun}</Text>
                                <Ionicons name="chevron-down" size={16} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-2">
                            {/* Catat Pengeluaran Button */}
                            <TouchableOpacity
                                onPress={() => setShowExpenseForm((prev) => !prev)}
                                className="flex-[1.5] bg-primary py-3 rounded-xl flex-row items-center justify-center shadow-md shadow-primary/20 active:bg-accent"
                            >
                                <Ionicons name="add" size={18} color="white" />
                                <Text className="text-white font-black text-sm ml-1">+ Catat Pengeluaran</Text>
                            </TouchableOpacity>

                            {/* Cetak CSV Button (Disabled Placeholder) */}
                            <TouchableOpacity
                                disabled={true}
                                className="flex-1 border border-gray-200 bg-gray-50 py-3 rounded-xl flex-row items-center justify-center opacity-60"
                            >
                                <Ionicons name="download-outline" size={16} color="#9ca3af" />
                                <Text className="text-gray-400 font-black text-sm ml-1">Cetak CSV</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {errorMessage ? (
                        <View className="mx-6 mb-6 rounded-xl border border-danger/20 bg-danger/10 p-4">
                            <Text className="text-sm font-semibold text-danger">{errorMessage}</Text>
                        </View>
                    ) : null}

                    {/* Loading Indicator */}
                    {isLoading ? (
                        <View className="py-20 justify-center items-center">
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text className="text-gray-500 mt-3 font-semibold">Memuat data laporan...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <LaporanSummaryCards
                                totalPemasukan={summary?.total_pemasukan ?? 0}
                                totalPengeluaran={summary?.total_pengeluaran ?? 0}
                                labaBersih={summary?.laba_bersih ?? 0}
                                formatCurrency={formatCurrency}
                            />

                            {/* + Catatan Pengeluaran Baru Form */}
                            <FormTambahPengeluaran
                                isCollapsed={!showExpenseForm}
                                setIsCollapsed={(val) => setShowExpenseForm(!val)}
                                form={form}
                                onChangeForm={handleFormChange}
                                onSubmit={handleSubmitExpense}
                                isSubmitting={isSubmitting}
                            />

                            {/* Tables containing expenses and payments */}
                            <LaporanTables
                                activeTab={activeTableTab}
                                setActiveTab={setActiveTableTab}
                                pengeluaranList={pengeluaran}
                                pembayaranList={pembayaran}
                                onDeletePengeluaran={handleDeleteExpense}
                                formatCurrency={formatCurrency}
                            />
                        </>
                    )}
                </ScrollView>

                {/* Combined Filter Selection Modal */}
                <LaporanFilterModal
                    visible={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    selectedBulan={bulan}
                    selectedTahun={tahun}
                    onApply={handleApplyFilter}
                />
            </View>
        </ProtectedRoute>
    );
>>>>>>> origin/ima/admin-penghuni-laporan-keuangan
}