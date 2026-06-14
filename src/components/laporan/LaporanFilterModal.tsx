import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LaporanFilterModalProps {
    visible: boolean;
    onClose: () => void;
    selectedBulan: number;
    selectedTahun: number;
    onApply: (bulan: number, tahun: number) => void;
}

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export const LaporanFilterModal: React.FC<LaporanFilterModalProps> = ({
    visible,
    onClose,
    selectedBulan,
    selectedTahun,
    onApply,
}) => {
    const [tempBulan, setTempBulan] = useState(selectedBulan);
    const [tempTahun, setTempTahun] = useState(selectedTahun);

    // Sync state when modal opens
    React.useEffect(() => {
        if (visible) {
            setTempBulan(selectedBulan);
            setTempTahun(selectedTahun);
        }
    }, [visible, selectedBulan, selectedTahun]);

    const handleSave = () => {
        onApply(tempBulan, tempTahun);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-dark">Filter Laporan</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
                            <Ionicons name="close" size={20} color="#4b5563" />
                        </TouchableOpacity>
                    </View>

                    {/* Month Picker Selection */}
                    <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Pilih Bulan</Text>
                    <View className="flex-row flex-wrap mb-6">
                        {MONTH_NAMES.map((name, index) => {
                            const monthNum = index + 1;
                            const isSelected = tempBulan === monthNum;
                            return (
                                <TouchableOpacity
                                    key={monthNum}
                                    onPress={() => setTempBulan(monthNum)}
                                    className={`w-[30%] m-[1.6%] py-2.5 rounded-xl items-center border ${
                                        isSelected 
                                            ? "bg-primary border-primary" 
                                            : "bg-white border-gray-200"
                                    }`}
                                >
                                    <Text className={`font-semibold text-xs ${isSelected ? "text-white" : "text-gray-600"}`}>
                                        {name.slice(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Year Picker Selection */}
                    <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Pilih Tahun</Text>
                    <View className="flex-row flex-wrap mb-6">
                        {YEAR_OPTIONS.map((year) => {
                            const isSelected = tempTahun === year;
                            return (
                                <TouchableOpacity
                                    key={year}
                                    onPress={() => setTempTahun(year)}
                                    className={`px-4 py-2.5 m-1 rounded-xl items-center border ${
                                        isSelected 
                                            ? "bg-primary border-primary" 
                                            : "bg-white border-gray-200"
                                    }`}
                                >
                                    <Text className={`font-semibold text-xs ${isSelected ? "text-white" : "text-gray-600"}`}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row justify-end space-x-3 mt-2">
                        <TouchableOpacity
                            onPress={onClose}
                            className="px-5 py-3 rounded-xl bg-gray-100"
                        >
                            <Text className="font-semibold text-gray-600 text-xs">Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            className="px-5 py-3 rounded-xl bg-primary shadow-sm"
                        >
                            <Text className="font-semibold text-white text-xs">Terapkan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
