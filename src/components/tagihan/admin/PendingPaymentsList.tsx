import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { PendingPembayaranItem } from "@/types/tagihan";

interface PendingPaymentsListProps {
  pendingPayments: PendingPembayaranItem[];
  onInspect: (payment: PendingPembayaranItem) => void;
}

const formatRupiah = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const PendingPaymentsList: React.FC<PendingPaymentsListProps> = ({
  pendingPayments,
  onInspect,
}) => {
  if (pendingPayments.length === 0) {
    return (
      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" }}>
        <Text style={{ color: "#888", fontWeight: "700" }}>
          Tidak ada pembayaran yang perlu divalidasi.
        </Text>
      </View>
    );
  }

  return (
    <>
      {pendingPayments.map((payment) => (
        <View
          key={payment.id_pembayaran}
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
            elevation: 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <View>
              <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 14 }}>
                {payment.tagihan?.penyewa.nama_lengkap || "-"}
              </Text>
              <Text style={{ fontSize: 11, color: "#888" }}>
                Kamar {payment.tagihan?.kamar.nomor_kamar || "-"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#fffbeb",
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 10 }}>Pending</Text>
            </View>
          </View>

          <Text style={{ fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
            {formatRupiah(payment.jumlah_bayar)}
          </Text>
          <Text style={{ fontSize: 12, color: "#888", marginBottom: 10, textTransform: "capitalize" }}>
            {payment.metode_pembayaran} • {formatDate(payment.tanggal_bayar)}
          </Text>

          <TouchableOpacity
            onPress={() => onInspect(payment)}
            style={{
              backgroundColor: "#fffbeb",
              borderRadius: 10,
              padding: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#fde68a",
            }}
          >
            <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 13 }}>
              🔍 Periksa & Verifikasi
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
};
