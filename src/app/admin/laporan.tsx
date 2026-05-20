import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLaporanKeuangan } from "@/hooks/useLaporanKeuangan";

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
        yearOptions,
        monthOptions,
        form,
        setForm,
        handleSubmitExpense,
        handleDeleteExpense,
        formatCurrency,
    } = useLaporanKeuangan();

    // Custom dropdown modal state
    const [isBulanModalOpen, setIsBulanModalOpen] = useState(false);
    const [isTahunModalOpen, setIsTahunModalOpen] = useState(false);

    const activeMonthLabel = monthOptions.find((m) => m.value === bulan)?.label || "";

    const summary = data?.summary;
    const pengeluaran = data?.pengeluaran_terbaru || [];
    const pembayaran = data?.pembayaran_terbaru || [];

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
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Controls Bar */}
                    <View className="flex-col gap-3 mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <View className="flex-row gap-2 justify-between">
                            {/* Month Dropdown Button */}
                            <TouchableOpacity
                                onPress={() => setIsBulanModalOpen(true)}
                                className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
                            >
                                <Text className="text-sm font-bold text-dark">{activeMonthLabel}</Text>
                                <Ionicons name="chevron-down" size={16} color="#4b5563" />
                            </TouchableOpacity>

                            {/* Year Dropdown Button */}
                            <TouchableOpacity
                                onPress={() => setIsTahunModalOpen(true)}
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
                        <View className="mb-6 rounded-xl border border-danger/20 bg-danger/10 p-4">
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
                            <View className="gap-4 mb-6">
                                {/* Total Pemasukan Card */}
                                <View className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex-col">
                                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Pemasukan</Text>
                                    <Text className="mt-2 text-2xl font-black text-success">
                                        {formatCurrency(summary?.total_pemasukan ?? 0)}
                                    </Text>
                                </View>

                                {/* Total Pengeluaran Card */}
                                <View className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex-col">
                                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Pengeluaran</Text>
                                    <Text className="mt-2 text-2xl font-black text-danger">
                                        {formatCurrency(summary?.total_pengeluaran ?? 0)}
                                    </Text>
                                </View>

                                {/* Saldo Bersih Card */}
                                <View className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex-col">
                                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Saldo Bersih</Text>
                                    <Text className="mt-2 text-2xl font-black text-primary">
                                        {formatCurrency(summary?.laba_bersih ?? 0)}
                                    </Text>
                                </View>
                            </View>

                            {/* + Catatan Pengeluaran Baru Form */}
                            {showExpenseForm && (
                                <View className="rounded-2xl border border-gray-100 bg-white p-5 mb-6 shadow-sm">
                                    <Text className="text-lg font-black text-dark mb-4">+ Catatan Pengeluaran Baru</Text>
                                    
                                    <View className="gap-4">
                                        {/* Tanggal */}
                                        <View>
                                            <Text className="text-xs font-bold text-gray-500 mb-1">Tanggal (YYYY-MM-DD)</Text>
                                            <View className="relative justify-center">
                                                <TextInput
                                                    value={form.tanggal_pengeluaran}
                                                    onChangeText={(val) => setForm((prev) => ({ ...prev, tanggal_pengeluaran: val }))}
                                                    placeholder="2026-05-20"
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark bg-gray-50"
                                                    placeholderTextColor="#9ca3af"
                                                />
                                                <View className="absolute right-4">
                                                    <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                                                </View>
                                            </View>
                                        </View>

                                        {/* Keterangan */}
                                        <View>
                                            <Text className="text-xs font-bold text-gray-500 mb-1">Keterangan *</Text>
                                            <TextInput
                                                value={form.judul_pengeluaran}
                                                onChangeText={(val) => setForm((prev) => ({ ...prev, judul_pengeluaran: val }))}
                                                placeholder="Contoh: Pembelian alat kebersihan"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark bg-gray-50"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>

                                        {/* Jumlah */}
                                        <View>
                                            <Text className="text-xs font-bold text-gray-500 mb-1">Jumlah (Rp) *</Text>
                                            <TextInput
                                                value={form.jumlah_pengeluaran}
                                                onChangeText={(val) => setForm((prev) => ({ ...prev, jumlah_pengeluaran: val }))}
                                                placeholder="Contoh: 150000"
                                                keyboardType="numeric"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark bg-gray-50"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>

                                        {/* Deskripsi */}
                                        <View>
                                            <Text className="text-xs font-bold text-gray-500 mb-1">Deskripsi</Text>
                                            <TextInput
                                                value={form.deskripsi}
                                                onChangeText={(val) => setForm((prev) => ({ ...prev, deskripsi: val }))}
                                                placeholder="Detail barang atau perbaikan..."
                                                multiline={true}
                                                numberOfLines={3}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark bg-gray-50 text-top h-20"
                                                style={{ textAlignVertical: "top" }}
                                                placeholderTextColor="#9ca3af"
                                            />
                                        </View>

                                        {/* Form Actions */}
                                        <View className="flex-row justify-end gap-3 mt-2">
                                            <TouchableOpacity
                                                onPress={() => setShowExpenseForm(false)}
                                                className="px-5 py-2.5 rounded-xl"
                                            >
                                                <Text className="text-sm font-bold text-gray-500">Batal</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleSubmitExpense}
                                                disabled={isSubmitting}
                                                className="bg-primary px-6 py-2.5 rounded-xl shadow-md shadow-primary/20 active:bg-accent disabled:opacity-50"
                                            >
                                                <Text className="text-white font-black text-sm">
                                                    {isSubmitting ? "Menyimpan..." : "Simpan"}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Daftar Pengeluaran Card */}
                            <View className="rounded-2xl border border-gray-100 bg-white shadow-sm mb-6 overflow-hidden">
                                <View className="border-b border-gray-100 p-5">
                                    <Text className="text-lg font-black text-dark">Daftar Pengeluaran</Text>
                                    <Text className="text-sm font-medium text-gray-500 mt-1">
                                        Total tagihan belum bayar:{" "}
                                        <Text className="font-bold text-warning">
                                            {formatCurrency(summary?.tagihan_belum_bayar ?? 0)}
                                        </Text>
                                    </Text>
                                </View>

                                {/* List Header */}
                                <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-100">
                                    <Text className="w-[20%] text-[10px] font-bold text-gray-400 uppercase">Tanggal</Text>
                                    <Text className="w-[45%] text-[10px] font-bold text-gray-400 uppercase">Keterangan</Text>
                                    <Text className="w-[22%] text-[10px] font-bold text-gray-400 uppercase text-right">Jumlah</Text>
                                    <Text className="w-[13%] text-[10px] font-bold text-gray-400 uppercase text-right">Aksi</Text>
                                </View>

                                {/* List Items */}
                                {pengeluaran.length === 0 ? (
                                    <View className="py-8 px-4 justify-center items-center">
                                        <Text className="text-sm font-medium text-gray-400 text-center">
                                            Belum ada pengeluaran pada periode ini.
                                        </Text>
                                    </View>
                                ) : (
                                    pengeluaran.map((item) => (
                                        <View key={item.id_pengeluaran} className="flex-row items-center px-4 py-4 border-b border-gray-100">
                                            <Text className="w-[20%] text-xs font-semibold text-gray-600">
                                                {item.tanggal_pengeluaran}
                                            </Text>

                                            <View className="w-[45%] pr-2">
                                                <Text className="text-sm font-black text-dark">{item.judul_pengeluaran}</Text>
                                                {item.deskripsi ? (
                                                    <Text className="text-xs font-medium text-gray-400 mt-0.5" numberOfLines={2}>
                                                        {item.deskripsi}
                                                    </Text>
                                                ) : null}
                                            </View>

                                            <Text className="w-[22%] text-sm font-black text-danger text-right">
                                                {formatCurrency(item.jumlah_pengeluaran)}
                                            </Text>

                                            <View className="w-[13%] items-end">
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteExpense(item.id_pengeluaran)}
                                                    className="py-1"
                                                >
                                                    <Text className="text-xs font-black text-danger underline">Hapus</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* Pembayaran Terbaru Card */}
                            <View className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                <View className="border-b border-gray-100 p-5">
                                    <Text className="text-lg font-black text-dark">Pembayaran Terbaru</Text>
                                </View>

                                {/* List Header */}
                                <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-100">
                                    <Text className="w-[40%] text-[10px] font-bold text-gray-400 uppercase">Penghuni</Text>
                                    <Text className="w-[22%] text-[10px] font-bold text-gray-400 uppercase">Tanggal</Text>
                                    <Text className="w-[22%] text-[10px] font-bold text-gray-400 uppercase text-right">Jumlah</Text>
                                    <Text className="w-[16%] text-[10px] font-bold text-gray-400 uppercase text-right">Status</Text>
                                </View>

                                {/* List Items */}
                                {pembayaran.length === 0 ? (
                                    <View className="py-8 px-4 justify-center items-center">
                                        <Text className="text-sm font-medium text-gray-400 text-center">
                                            Belum ada pembayaran pada periode ini.
                                        </Text>
                                    </View>
                                ) : (
                                    pembayaran.map((item) => (
                                        <View key={item.id_pembayaran} className="flex-row items-center px-4 py-4 border-b border-gray-100">
                                            <View className="w-[40%] pr-2">
                                                <Text className="text-sm font-black text-dark">{item.nama_lengkap || "-"}</Text>
                                                <Text className="text-xs font-medium text-gray-400 mt-0.5">{item.kode_invoice || "-"}</Text>
                                            </View>

                                            <Text className="w-[22%] text-xs font-semibold text-gray-600">
                                                {item.tanggal_bayar}
                                            </Text>

                                            <Text className="w-[22%] text-sm font-black text-success text-right">
                                                {formatCurrency(item.jumlah_bayar)}
                                            </Text>

                                            <View className="w-[16%] items-end">
                                                <View className="bg-success/10 px-2 py-1 rounded-full">
                                                    <Text className="text-[10px] font-black text-success uppercase">
                                                        {item.status_verifikasi}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Bulan Selection Modal */}
                <Modal
                    visible={isBulanModalOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsBulanModalOpen(false)}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center p-6">
                        <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex-col">
                            <Text className="text-lg font-black text-dark mb-4">Pilih Bulan</Text>
                            <ScrollView className="max-h-[300px] mb-4" showsVerticalScrollIndicator={false}>
                                {monthOptions.map((item) => (
                                    <TouchableOpacity
                                        key={item.value}
                                        onPress={() => {
                                            setBulan(item.value);
                                            setIsBulanModalOpen(false);
                                        }}
                                        className={`py-3.5 border-b border-gray-100 flex-row justify-between items-center ${
                                            bulan === item.value ? "bg-blue-50/50 rounded-xl px-2" : ""
                                        }`}
                                    >
                                        <Text className={`text-base font-bold ${bulan === item.value ? "text-primary" : "text-dark"}`}>
                                            {item.label}
                                        </Text>
                                        {bulan === item.value && (
                                            <Ionicons name="checkmark" size={20} color="#2563eb" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => setIsBulanModalOpen(false)}
                                className="bg-gray-100 py-3.5 rounded-2xl items-center"
                            >
                                <Text className="font-bold text-gray-500">Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Tahun Selection Modal */}
                <Modal
                    visible={isTahunModalOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsTahunModalOpen(false)}
                >
                    <View className="flex-1 bg-black/50 justify-center items-center p-6">
                        <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl flex-col">
                            <Text className="text-lg font-black text-dark mb-4">Pilih Tahun</Text>
                            <ScrollView className="max-h-[300px] mb-4" showsVerticalScrollIndicator={false}>
                                {yearOptions.map((yearVal) => (
                                    <TouchableOpacity
                                        key={yearVal}
                                        onPress={() => {
                                            setTahun(yearVal);
                                            setIsTahunModalOpen(false);
                                        }}
                                        className={`py-3.5 border-b border-gray-100 flex-row justify-between items-center ${
                                            tahun === yearVal ? "bg-blue-50/50 rounded-xl px-2" : ""
                                        }`}
                                    >
                                        <Text className={`text-base font-bold ${tahun === yearVal ? "text-primary" : "text-dark"}`}>
                                            {yearVal}
                                        </Text>
                                        {tahun === yearVal && (
                                            <Ionicons name="checkmark" size={20} color="#2563eb" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => setIsTahunModalOpen(false)}
                                className="bg-gray-100 py-3.5 rounded-2xl items-center"
                            >
                                <Text className="font-bold text-gray-500">Tutup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </ProtectedRoute>
    );
}