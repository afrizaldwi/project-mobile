import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { TagihanReminderItem } from "@/types/tagihan";
import { PaymentStateContext } from "@/services/payment/PaymentState";
import { formatRupiah, formatDate } from "@/utils/formatters";

interface ActiveTagihanCardProps {
  item: TagihanReminderItem;
  onPay: (item: TagihanReminderItem) => void;
}



const getStatusConfig = (item: TagihanReminderItem) => {
  const state = PaymentStateContext.getState(item);
  return {
    label: state.getStatusLabel(false),
    color: state.getStatusColor(),
    bg: state.getStatusBg(),
  };
};

const canPay = (item: TagihanReminderItem) => {
  return PaymentStateContext.getState(item).canPay();
};

const getActionLabel = (item: TagihanReminderItem, payable: boolean) => {
  if (item.status_tagihan === "dibatalkan") return "Tagihan Dibatalkan";
  if (item.pembayaran_terbaru?.status_verifikasi === "pending") return "Menunggu Verifikasi";
  return payable ? "Bayar Sekarang" : "Tidak Dapat Dibayar";
};

export const ActiveTagihanCard: React.FC<ActiveTagihanCardProps> = ({ item, onPay }) => {
  const status = getStatusConfig(item);
  const payable = canPay(item);

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Peringatan H-7 banner */}
      {item.peringatan.aktif && (
        <View
          style={{
            backgroundColor: "#fffbeb",
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
            borderLeftWidth: 3,
            borderLeftColor: "#f59e0b",
          }}
        >
          <Text style={{ fontWeight: "800", color: "#92400e", fontSize: 12 }}>
            ⚠️ {item.peringatan.judul}
          </Text>
          {item.peringatan.hari_tersisa !== null && (
            <Text style={{ fontSize: 11, color: "#78350f", marginTop: 2 }}>
              {item.peringatan.hari_tersisa > 0
                ? `Jatuh tempo dalam ${item.peringatan.hari_tersisa} hari`
                : "Tagihan sudah melewati jatuh tempo!"}
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View>
          <Text style={{ fontSize: 10, color: "#999", fontWeight: "700", letterSpacing: 1 }}>
            {item.kode_invoice}
          </Text>
          <Text style={{ fontSize: 17, fontWeight: "900", color: "#1a1a1a", marginTop: 2 }}>
            Kamar {item.kamar.nomor_kamar || "-"}
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
          <Text style={{ color: status.color, fontWeight: "800", fontSize: 11 }}>
            {status.label}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#f5f5f5",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>TOTAL TAGIHAN</Text>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginTop: 2 }}>
            {formatRupiah(item.total_tagihan)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "#888", fontWeight: "700" }}>JATUH TEMPO</Text>
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#1a1a1a", marginTop: 2 }}>
            {formatDate(item.tanggal_jatuh_tempo, { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>
      </View>

      {item.pembayaran_terbaru?.status_verifikasi === "ditolak" &&
        item.pembayaran_terbaru.catatan_admin && (
          <View style={{ backgroundColor: "#fef2f2", borderRadius: 10, padding: 10, marginBottom: 12 }}>
            <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "700" }}>
              Catatan admin: {item.pembayaran_terbaru.catatan_admin}
            </Text>
          </View>
        )}

      <TouchableOpacity
        disabled={!payable}
        onPress={() => onPay(item)}
        style={{
          backgroundColor: payable ? "#3b82f6" : "#d1d5db",
          borderRadius: 12,
          padding: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
          {getActionLabel(item, payable)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
