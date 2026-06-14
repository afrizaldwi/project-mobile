import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { FormTambahPengeluaran } from "@/components/laporan/FormTambahPengeluaran";
import { LaporanFilterModal } from "@/components/laporan/LaporanFilterModal";
import { LaporanSummaryCards } from "@/components/laporan/LaporanSummaryCards";
import { LaporanTables } from "@/components/laporan/LaporanTables";
import { useLaporanKeuangan } from "@/hooks/useLaporanKeuangan";
import { formatCurrency } from "@/utils/formatUtils";

export default function AdminLaporanScreen() {
    const {
        bulan,
        setBulan,
        tahun,
        setTahun,
        data,
        isLoading,
        isRefreshing,
        isSubmitting,
        isDeleting,
        showExpenseForm,
        setShowExpenseForm,
        errorMessage,
        notice,
        monthOptions,
        form,
        setForm,
        handleSubmitExpense,
        deleteConfirm,
        requestDeleteExpense,
        confirmDeleteExpense,
        cancelDeleteExpense,
        refresh,
        isOffline,
    } = useLaporanKeuangan();

    const [activeTableTab, setActiveTableTab] = useState<"pengeluaran" | "pembayaran">("pengeluaran");
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
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-light">
                {/* Header */}
                <View className="bg-white px-6 pt-6 pb-4 shadow-sm border-b border-gray-100 z-10">
                    <Text className="text-2xl font-black text-dark">Laporan Keuangan</Text>
                    <Text className="text-sm font-medium text-gray-500 mt-1">
                        Ringkasan transaksi dan pencatatan pengeluaran operasional.
                    </Text>
                </View>

                {/* Konten Utama */}
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
                    }
                >
                    {/* Controls Bar */}
                    <View className="mx-6 mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-col gap-3">
                        <View className="flex-row gap-2 justify-between">
                            <TouchableOpacity
                                onPress={() => setIsFilterModalOpen(true)}
                                className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
                            >
                                <Text className="text-sm font-bold text-dark">{activeMonthLabel}</Text>
                                <Ionicons name="chevron-down" size={16} color="#4b5563" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsFilterModalOpen(true)}
                                className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
                            >
                                <Text className="text-sm font-bold text-dark">{tahun}</Text>
                                <Ionicons name="chevron-down" size={16} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        {!isOffline && (
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setShowExpenseForm((prev) => !prev)}
                                    className="flex-[1.5] bg-primary py-3 rounded-xl flex-row items-center justify-center shadow-md shadow-primary/20 active:bg-accent"
                                >
                                    <Ionicons name="add" size={18} color="white" />
                                    <Text className="text-white font-black text-sm ml-1">
                                        + Catat Pengeluaran
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Error & Notice */}
                    {errorMessage ? (
                        <View className="mx-6 mb-6 rounded-xl border border-danger/20 bg-danger/10 p-4">
                            <Text className="text-sm font-semibold text-danger">{errorMessage}</Text>
                        </View>
                    ) : null}
                    {notice ? (
                        <View className="mx-6 mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
                            <Text className="text-sm font-semibold text-primary">{notice}</Text>
                        </View>
                    ) : null}

                    {/* Loading */}
                    {isLoading && !data ? (
                        <View className="py-20 justify-center items-center">
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text className="text-gray-500 mt-3 font-semibold">
                                Memuat data laporan...
                            </Text>
                        </View>
                    ) : (
                        <>
                            <LaporanSummaryCards
                                totalPemasukan={summary?.total_pemasukan ?? 0}
                                totalPengeluaran={summary?.total_pengeluaran ?? 0}
                                labaBersih={summary?.laba_bersih ?? 0}
                                formatCurrency={formatCurrency}
                            />

                            {!isOffline && (
                                <FormTambahPengeluaran
                                    isCollapsed={!showExpenseForm}
                                    setIsCollapsed={(val: boolean) => setShowExpenseForm(!val)}
                                    form={form}
                                    onChangeForm={handleFormChange}
                                    onSubmit={handleSubmitExpense}
                                    isSubmitting={isSubmitting}
                                />
                            )}

                            {/* LaporanTables meneruskan info hapus ke sini — bukan Alert langsung */}
                            <LaporanTables
                                activeTab={activeTableTab}
                                setActiveTab={setActiveTableTab}
                                pengeluaranList={pengeluaran}
                                pembayaranList={pembayaran}
                                onDeletePengeluaran={requestDeleteExpense}
                                formatCurrency={formatCurrency}
                                isOffline={isOffline}
                            />
                        </>
                    )}
                </ScrollView>

                {/* Filter Modal */}
                <LaporanFilterModal
                    visible={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    selectedBulan={bulan}
                    selectedTahun={tahun}
                    onApply={handleApplyFilter}
                />

                {/* Modal Konfirmasi Hapus Pengeluaran (Poin 8) */}
                <ConfirmationModal
                    visible={deleteConfirm.visible}
                    title="Hapus Pengeluaran"
                    description="Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
                    confirmLabel="Ya, Hapus"
                    confirmVariant="danger"
                    isLoading={isDeleting}
                    dataPreview={[
                        {
                            label: "Judul",
                            value: deleteConfirm.judulPengeluaran || "-",
                        },
                        {
                            label: "Nominal",
                            value: deleteConfirm.jumlahPengeluaran
                                ? formatCurrency(deleteConfirm.jumlahPengeluaran)
                                : "-",
                        },
                        {
                            label: "Tanggal",
                            value: deleteConfirm.tanggalPengeluaran || "-",
                        },
                    ]}
                    onConfirm={confirmDeleteExpense}
                    onCancel={cancelDeleteExpense}
                />
            </View>
        </ProtectedRoute>
    );
}
