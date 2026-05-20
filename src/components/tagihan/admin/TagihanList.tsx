import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { TagihanReminderItem } from "@/api/tagihanApi";
import { PaymentStateContext } from "@/services/payment/PaymentState";

interface TagihanListProps {
  tagihan: TagihanReminderItem[];
  handleSendWA: (item: TagihanReminderItem) => void;
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

const getStatusConfig = (item: TagihanReminderItem) => {
  const state = PaymentStateContext.getState(item);
  return {
    label: state.getStatusLabel(true),
    color: state.getStatusColor(),
    bg: state.getStatusBg(),
  };
};

export const TagihanList: React.FC<TagihanListProps> = ({ tagihan, handleSendWA }) => {
  if (tagihan.length === 0) {
    return (
      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" }}>
        <Text style={{ color: "#888", fontWeight: "700" }}>Tidak ada data tagihan.</Text>
      </View>
    );
  }

  return (
    <>
      {tagihan.map((item) => {
        const status = getStatusConfig(item);
        return (
          <View
            key={item.id_tagihan}
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
                  {item.penyewa.nama_lengkap || "-"}
                </Text>
                <Text style={{ fontSize: 11, color: "#888" }}>
                  Kamar {item.kamar.nomor_kamar || "-"} • {item.kode_invoice}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: status.bg,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: status.color, fontWeight: "800", fontSize: 10 }}>
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontWeight: "900", color: "#1a1a1a" }}>
                {formatRupiah(item.total_tagihan)}
              </Text>
              <Text style={{ color: "#888", fontSize: 12 }}>
                Jatuh tempo: {formatDate(item.tanggal_jatuh_tempo)}
              </Text>
            </View>

            {/* Kirim WA */}
            <TouchableOpacity
              onPress={() => handleSendWA(item)}
              style={{
                backgroundColor: item.whatsapp.enabled && item.whatsapp.url ? "#f0fdf4" : "#f5f5f5",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: item.whatsapp.enabled && item.whatsapp.url ? "#86efac" : "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: item.whatsapp.enabled && item.whatsapp.url ? "#15803d" : "#9ca3af",
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                {item.whatsapp.enabled && item.whatsapp.url ? "💬 Kirim WA" : "WA Tidak Tersedia"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </>
  );
};
