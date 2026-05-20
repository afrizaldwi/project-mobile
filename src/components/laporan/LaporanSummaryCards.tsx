import React from "react";
import { View, Text } from "react-native";

interface LaporanSummaryCardsProps {
    totalPemasukan: number;
    totalPengeluaran: number;
    labaBersih: number;
    formatCurrency: (value: number) => string;
}

export const LaporanSummaryCards: React.FC<LaporanSummaryCardsProps> = ({
    totalPemasukan,
    totalPengeluaran,
    labaBersih,
    formatCurrency,
}) => {
    return (
        <View className="px-6 mb-6">
            <View className="flex-row justify-between mb-4">
                {/* Total Pemasukan Card */}
                <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1 mr-2.5">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pemasukan</Text>
                    <Text className="text-lg font-extrabold text-green-600 mt-2">
                        {formatCurrency(totalPemasukan)}
                    </Text>
                    <View className="bg-green-50 self-start px-2 py-0.5 rounded mt-2">
                        <Text className="text-[10px] font-bold text-green-600">Bulan Ini</Text>
                    </View>
                </View>

                {/* Total Pengeluaran Card */}
                <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-1 ml-2.5">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pengeluaran</Text>
                    <Text className="text-lg font-extrabold text-red-600 mt-2">
                        {formatCurrency(totalPengeluaran)}
                    </Text>
                    <View className="bg-red-50 self-start px-2 py-0.5 rounded mt-2">
                        <Text className="text-[10px] font-bold text-red-600">Bulan Ini</Text>
                    </View>
                </View>
            </View>

            {/* Laba Bersih Card */}
            <View className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Laba Bersih (Saldo)</Text>
                        <Text className={`text-2xl font-extrabold mt-1.5 ${labaBersih >= 0 ? "text-primary" : "text-red-600"}`}>
                            {formatCurrency(labaBersih)}
                        </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${labaBersih >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
                        <Text className={`text-xs font-bold ${labaBersih >= 0 ? "text-primary" : "text-red-600"}`}>
                            {labaBersih >= 0 ? "Surplus" : "Defisit"}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};
