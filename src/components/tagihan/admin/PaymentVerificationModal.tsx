import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import type { PendingPembayaranItem } from "@/types/tagihan";
import { normalizeStorageUrl } from "@/utils/storageUrl";
import { formatRupiah } from "@/utils/formatters";

interface PaymentVerificationModalProps {
  visible: boolean;
  preview: PendingPembayaranItem | null;
  catatan: string;
  setCatatan: (text: string) => void;
  verifyingId: number | null;
  handleVerify: (idPembayaran: number, action: "diterima" | "ditolak") => Promise<void>;
  onClose: () => void;
}



export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  visible,
  preview,
  catatan,
  setCatatan,
  verifyingId,
  handleVerify,
  onClose,
}) => {
  const buktiBayarUrl = normalizeStorageUrl(preview?.bukti_bayar_url ?? preview?.bukti_bayar);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: "90%",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 16 }}>
            Verifikasi Pembayaran
          </Text>
          {preview && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: "#f5f5f5", borderRadius: 12, padding: 14, marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>PENYEWA</Text>
                <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 15, marginTop: 2 }}>
                  {preview.tagihan?.penyewa.nama_lengkap || "-"}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  Kamar {preview.tagihan?.kamar.nomor_kamar || "-"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>NOMINAL</Text>
                  <Text style={{ fontWeight: "900", color: "#1a1a1a", marginTop: 2 }}>
                    {formatRupiah(preview.jumlah_bayar)}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#f5f5f5", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>METODE</Text>
                  <Text style={{ fontWeight: "900", color: "#1a1a1a", marginTop: 2, textTransform: "capitalize" }}>
                    {preview.metode_pembayaran}
                  </Text>
                </View>
              </View>

              {buktiBayarUrl ? (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(buktiBayarUrl!)
                    }
                  >
                    {/\.(jpg|jpeg|png|webp)$/i.test(buktiBayarUrl) ? (
                      <Image
                        source={{ uri: buktiBayarUrl }}
                        style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 10 }}
                        resizeMode="contain"
                      />
                    ) : null}
                    <View
                      style={{
                        backgroundColor: "#eff6ff",
                        borderRadius: 12,
                        padding: 12,
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: "#1d4ed8", fontWeight: "800", fontSize: 13 }}>
                        🔗 Buka Bukti Pembayaran
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ backgroundColor: "#fffbeb", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: "#d97706", fontWeight: "700", fontSize: 12 }}>
                    Bukti pembayaran belum tersedia.
                  </Text>
                </View>
              )}

              <TextInput
                value={catatan}
                onChangeText={setCatatan}
                placeholder="Catatan tambahan (opsional)..."
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  color: "#1a1a1a",
                  marginBottom: 16,
                  textAlignVertical: "top",
                }}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleVerify(preview.id_pembayaran, "ditolak")}
                  disabled={verifyingId === preview.id_pembayaran}
                  style={{
                    flex: 1,
                    borderWidth: 2,
                    borderColor: "#dc2626",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#dc2626", fontWeight: "900" }}>Tolak</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleVerify(preview.id_pembayaran, "diterima")}
                  disabled={verifyingId === preview.id_pembayaran}
                  style={{
                    flex: 1,
                    backgroundColor: "#16a34a",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                  }}
                >
                  {verifyingId === preview.id_pembayaran ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "900" }}>Terima</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onClose} style={{ alignItems: "center", marginTop: 14 }}>
                <Text style={{ color: "#888", fontWeight: "700" }}>Batal</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
