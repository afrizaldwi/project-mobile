import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ConfirmationModalProps {
    /** Apakah modal ditampilkan */
    visible: boolean;
    /** Judul modal, contoh: "Konfirmasi Hapus" */
    title: string;
    /** Pesan penjelasan aksi yang akan dilakukan */
    description: string;
    /** Data ringkasan yang akan ditampilkan kepada pengguna sebelum konfirmasi */
    dataPreview?: { label: string; value: string }[];
    /** Teks tombol konfirmasi, default: "Ya, Lanjutkan" */
    confirmLabel?: string;
    /** Teks tombol batal, default: "Batal" */
    cancelLabel?: string;
    /* Warna tombol konfirmasi: "danger" untuk hapus, "primary" untuk submit */
    confirmVariant?: "danger" | "primary";
    /** Apakah sedang memproses (tampilkan loading di tombol konfirmasi) */
    isLoading?: boolean;
    /** Callback saat pengguna menekan tombol konfirmasi */
    onConfirm: () => void;
    /** Callback saat pengguna menekan tombol batal atau area luar modal */
    onCancel: () => void;
}

/**
 * Modal konfirmasi reusable yang menampilkan ringkasan data sebelum aksi dieksekusi.
 * Digunakan untuk memenuhi aturan: sebelum menghapus atau mengirimkan data,
 * pengguna harus dapat melihat dan memverifikasi data terlebih dahulu.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    title,
    description,
    dataPreview,
    confirmLabel = "Ya, Lanjutkan",
    cancelLabel = "Batal",
    confirmVariant = "primary",
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    const isDanger = confirmVariant === "danger";

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onCancel}
        >
            <View className="flex-1 justify-center items-center bg-black/50 px-6">
                <View className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                    {/* Icon Header */}
                    <View className="items-center mb-4">
                        <View
                            className="h-14 w-14 rounded-full items-center justify-center mb-3"
                            style={{
                                backgroundColor: isDanger ? "#fee2e2" : "#dbeafe",
                            }}
                        >
                            <Ionicons
                                name={isDanger ? "trash-outline" : "checkmark-circle-outline"}
                                size={28}
                                color={isDanger ? "#dc2626" : "#2563eb"}
                            />
                        </View>
                        <Text className="text-lg font-bold text-dark text-center">
                            {title}
                        </Text>
                        <Text className="text-sm text-gray-500 text-center mt-1">
                            {description}
                        </Text>
                    </View>

                    {/* Data Preview Section */}
                    {dataPreview && dataPreview.length > 0 && (
                        <View className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
                            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Ringkasan Data
                            </Text>
                            {dataPreview.map((item, index) => (
                                <View
                                    key={index}
                                    className="flex-row justify-between items-start py-1.5"
                                    style={
                                        index < dataPreview.length - 1
                                            ? { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }
                                            : undefined
                                    }
                                >
                                    <Text className="text-xs font-medium text-gray-500 flex-1">
                                        {item.label}
                                    </Text>
                                    <Text className="text-xs font-bold text-dark text-right flex-1 ml-2">
                                        {item.value}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={onCancel}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl bg-gray-100 items-center"
                        >
                            <Text className="font-semibold text-gray-600 text-sm">
                                {cancelLabel}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
                            style={{
                                backgroundColor: isDanger ? "#dc2626" : "#2563eb",
                                opacity: isLoading ? 0.7 : 1,
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                            ) : null}
                            <Text className="font-bold text-white text-sm">
                                {isLoading ? "Memproses..." : confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
