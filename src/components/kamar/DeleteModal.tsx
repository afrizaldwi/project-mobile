import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import type { Kamar } from "@/types/kamar";

type DeleteModalProps = {
    visible: boolean;
    kamar: Kamar | null;
    loading: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function DeleteModal({ visible, kamar, loading, onClose, onConfirm }: DeleteModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 px-6">
                <View className="w-full rounded-2xl bg-white p-6" style={{ elevation: 10 }}>
                    <View className="mb-3 flex-row items-center gap-3">
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                            <Text className="text-lg">🗑️</Text>
                        </View>
                        <View>
                            <Text className="text-base font-bold text-dark">
                                Hapus kamar ini?
                            </Text>
                            <Text className="text-xs text-gray-500">
                                No. {kamar?.nomor_kamar}
                            </Text>
                        </View>
                    </View>
                    <Text className="mb-5 text-sm leading-5 text-gray-600">
                        Data kamar yang dihapus tidak dapat dikembalikan. Pastikan kamar ini
                        tidak sedang dihuni sebelum menghapus.
                    </Text>
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={onClose}
                            className="flex-1 items-center rounded-xl border border-gray-200 py-3 active:opacity-70"
                        >
                            <Text className="text-sm font-semibold text-gray-700">Batal</Text>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            disabled={loading}
                            className="flex-1 items-center rounded-xl bg-red-600 py-3 active:opacity-70"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-sm font-semibold text-white">
                                    Ya, hapus
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
