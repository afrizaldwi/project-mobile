import React from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import type { TagihanReminderItem } from "@/types/tagihan";
import { formatRupiah } from "@/utils/formatters";

interface PaymentUploadModalProps {
  visible: boolean;
  selectedTagihan: TagihanReminderItem | null;
  metode: string;
  setMetode: (m: string) => void;
  imageUri: string | null;
  fileName?: string | null;
  handlePickImage: () => void;
  handleUpload: () => void;
  isUploading: boolean;
  onClose: () => void;
}



const METODE_OPTIONS = ["Transfer Bank", "E-Wallet", "Cash"];

export const PaymentUploadModal: React.FC<PaymentUploadModalProps> = ({
  visible,
  selectedTagihan,
  metode,
  setMetode,
  imageUri,
  fileName,
  handlePickImage,
  handleUpload,
  isUploading,
  onClose,
}) => {
  const hasSelectedFile = Boolean(fileName || imageUri);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 16 }}>
            Konfirmasi Bayar
          </Text>
          {selectedTagihan && (
            <>
              <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: "#888", fontWeight: "700" }}>TOTAL TAGIHAN</Text>
                <Text style={{ fontSize: 24, fontWeight: "900", color: "#1a1a1a", marginTop: 4 }}>
                  {formatRupiah(selectedTagihan.total_tagihan)}
                </Text>
              </View>

              {/* Pilih Metode */}
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#555", marginBottom: 8 }}>
                Metode Pembayaran
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                {METODE_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMetode(m.toLowerCase())}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: metode === m.toLowerCase() ? "#3b82f6" : "#e5e7eb",
                      backgroundColor: metode === m.toLowerCase() ? "#eff6ff" : "#fff",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: metode === m.toLowerCase() ? "#1d4ed8" : "#666",
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Upload Bukti */}
              <TouchableOpacity
                onPress={handlePickImage}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: hasSelectedFile ? "#3b82f6" : "#d1d5db",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 16,
                  backgroundColor: hasSelectedFile ? "#eff6ff" : "#f9fafb",
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>📎</Text>
                <Text style={{ fontWeight: "800", color: hasSelectedFile ? "#1d4ed8" : "#374151", fontSize: 13 }}>
                  {fileName || (imageUri ? "Gambar terpilih" : "Pilih Bukti Pembayaran (Gambar/PDF)")}
                </Text>
                <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                  JPG, JPEG, PNG, atau PDF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpload}
                disabled={isUploading}
                style={{
                  backgroundColor: isUploading ? "#93c5fd" : "#3b82f6",
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                    Kirim Bukti Bayar
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <Text style={{ color: "#888", fontWeight: "700" }}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
