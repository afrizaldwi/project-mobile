import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LaporanTablesProps {
    activeTab: "pengeluaran" | "pembayaran";
    setActiveTab: (tab: "pengeluaran" | "pembayaran") => void;
    pengeluaranList: any[];
    pembayaranList: any[];
    onDeletePengeluaran: (id: number) => void;
    formatCurrency: (value: number) => string;
}

export const LaporanTables: React.FC<LaporanTablesProps> = ({
    activeTab,
    setActiveTab,
    pengeluaranList,
    pembayaranList,
    onDeletePengeluaran,
    formatCurrency,
}) => {
    const confirmDelete = (id: number) => {
        Alert.alert(
            "Konfirmasi Hapus",
            "Apakah Anda yakin ingin menghapus catatan pengeluaran ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => onDeletePengeluaran(id),
                },
            ]
        );
    };

    return (
        <View className="bg-white rounded-3xl mx-6 p-5 border border-gray-100 shadow-sm mb-12">
            {/* Table Tabs */}
            <View className="flex-row border-b border-gray-100 pb-3 mb-4">
                <TouchableOpacity
                    onPress={() => setActiveTab("pengeluaran")}
                    className={`pb-2 mr-6 ${activeTab === "pengeluaran" ? "border-b-2 border-primary" : ""}`}
                >
                    <Text className={`font-bold text-sm ${activeTab === "pengeluaran" ? "text-primary" : "text-gray-400"}`}>
                        Daftar Pengeluaran
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab("pembayaran")}
                    className={`pb-2 ${activeTab === "pembayaran" ? "border-b-2 border-primary" : ""}`}
                >
                    <Text className={`font-bold text-sm ${activeTab === "pembayaran" ? "text-primary" : "text-gray-400"}`}>
                        Pembayaran Terbaru
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- TAB CONTENT: PENGELUARAN --- */}
            {activeTab === "pengeluaran" && (
                <View>
                    {/* Table Header */}
                    <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg mb-2">
                        <Text className="flex-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Judul & Tgl</Text>
                        <Text className="flex-1.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nominal</Text>
                        <Text className="flex-1 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aksi</Text>
                    </View>

                    {/* Table List Items */}
                    {pengeluaranList.length === 0 ? (
                        <View className="py-8 items-center">
                            <Ionicons name="receipt-outline" size={32} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs mt-2 font-medium">Belum ada catatan pengeluaran.</Text>
                        </View>
                    ) : (
                        pengeluaranList.map((item) => (
                            <View key={item.id_pengeluaran} className="flex-row items-center border-b border-gray-50 py-3.5 px-3">
                                <View className="flex-2">
                                    <Text className="font-bold text-dark text-sm" numberOfLines={1}>{item.judul_pengeluaran}</Text>
                                    <Text className="text-[10px] text-gray-400 mt-0.5">{item.tanggal_pengeluaran}</Text>
                                    {item.deskripsi && (
                                        <Text className="text-[10px] text-gray-400 mt-0.5 italic" numberOfLines={1}>
                                            "{item.deskripsi}"
                                        </Text>
                                    )}
                                </View>
                                <Text className="flex-1.5 text-right font-bold text-red-500 text-sm">
                                    -{formatCurrency(item.jumlah_pengeluaran)}
                                </Text>
                                <View className="flex-1 items-end">
                                    <TouchableOpacity onPress={() => confirmDelete(item.id_pengeluaran)} className="py-1 px-2 rounded-md bg-red-50">
                                        <Text className="text-[10px] font-bold text-red-600">Hapus</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}

            {/* --- TAB CONTENT: PEMBAYARAN --- */}
            {activeTab === "pembayaran" && (
                <View>
                    {/* Table Header */}
                    <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg mb-2">
                        <Text className="flex-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama & Invoice</Text>
                        <Text className="flex-1.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nominal</Text>
                        <Text className="flex-1 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</Text>
                    </View>

                    {/* Table List Items */}
                    {pembayaranList.length === 0 ? (
                        <View className="py-8 items-center">
                            <Ionicons name="card-outline" size={32} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs mt-2 font-medium">Belum ada transaksi pembayaran.</Text>
                        </View>
                    ) : (
                        pembayaranList.map((item) => (
                            <View key={item.id_pembayaran} className="flex-row items-center border-b border-gray-50 py-3.5 px-3">
                                <View className="flex-2">
                                    <Text className="font-bold text-dark text-sm" numberOfLines={1}>{item.nama_lengkap}</Text>
                                    <Text className="text-[10px] text-gray-400 mt-0.5">{item.kode_invoice}</Text>
                                    <Text className="text-[10px] text-gray-400 mt-0.5">Tgl: {item.tanggal_bayar} • {item.metode_pembayaran}</Text>
                                </View>
                                <Text className="flex-1.5 text-right font-bold text-green-600 text-sm">
                                    +{formatCurrency(item.jumlah_bayar)}
                                </Text>
                                <View className="flex-1 items-end">
                                    <View className="bg-green-100 px-2 py-0.5 rounded-full">
                                        <Text className="text-[9px] font-bold text-green-700 uppercase">{item.status_verifikasi}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}
        </View>
    );
};
