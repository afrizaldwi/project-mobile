import { TagihanReminderItem } from "@/api/tagihanApi";
import { PaymentStateContext } from "@/services/payment/PaymentState";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface TagihanListProps {
  tagihan: TagihanReminderItem[];
  handleSendWA: (item: TagihanReminderItem) => void;
  downloadingInvoiceId?: number | null;
  onDownloadInvoice?: (item: TagihanReminderItem) => void;
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

const isPaidOrVerified = (item: TagihanReminderItem) =>
  item.status_tagihan === "lunas" || item.pembayaran_terbaru?.status_verifikasi === "diterima";

const canSendWhatsApp = (item: TagihanReminderItem) =>
  item.status_tagihan !== "lunas" &&
  item.status_tagihan !== "dibatalkan" &&
  item.pembayaran_terbaru?.status_verifikasi !== "diterima" &&
  Boolean(item.whatsapp.enabled && item.whatsapp.url);

const canDownloadInvoice = (item: TagihanReminderItem) =>
  isPaidOrVerified(item) && Boolean(item.pembayaran_terbaru?.id_pembayaran);

export const TagihanList: React.FC<TagihanListProps> = ({
  tagihan,
  handleSendWA,
  downloadingInvoiceId,
  onDownloadInvoice,
}) => {
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
        const showWhatsAppButton = canSendWhatsApp(item);
        const showInvoiceButton = Boolean(canDownloadInvoice(item) && onDownloadInvoice);
        const isDownloading = downloadingInvoiceId === item.pembayaran_terbaru?.id_pembayaran;

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

            {showWhatsAppButton ? (
              <TouchableOpacity
                onPress={() => handleSendWA(item)}
                style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: 10,
                  padding: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#86efac",
                }}
              >
                <Text
                  style={{
                    color: "#15803d",
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  💬 Kirim WA
                </Text>
              </TouchableOpacity>
            ) : null}

            {showInvoiceButton ? (
              <TouchableOpacity
                onPress={() => onDownloadInvoice?.(item)}
                disabled={isDownloading}
                style={{
                  marginTop: 10,
                  backgroundColor: isDownloading ? "#93c5fd" : "#2563eb",
                  borderRadius: 10,
                  padding: 10,
                  alignItems: "center",
                }}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                    Unduh Invoice PDF
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </>
  );
};
