import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import type { TagihanReminderItem } from "@/types/tagihan";
import { isPaidOrVerified } from "@/utils/tagihanHelpers";
import { formatRupiah, formatDate } from "@/utils/formatters";

interface RiwayatPembayaranListProps {
  riwayat: TagihanReminderItem[];
  downloadingInvoiceId?: number | null;
  onDownloadInvoice?: (item: TagihanReminderItem) => void;
}



const canDownloadInvoice = (item: TagihanReminderItem) => {
  return (
    item.status_tagihan !== "dibatalkan" &&
    isPaidOrVerified(item) &&
    Boolean(item.pembayaran_terbaru?.id_pembayaran)
  );
};

export const RiwayatPembayaranList: React.FC<RiwayatPembayaranListProps> = ({
  riwayat,
  downloadingInvoiceId,
  onDownloadInvoice,
}) => {
  return (
    <>
      <Text style={{ fontSize: 17, fontWeight: "900", color: "#1a1a1a", marginTop: 8, marginBottom: 4 }}>
        Riwayat Pembayaran
      </Text>
      <Text style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
        Daftar tagihan yang sudah lunas.
      </Text>

      {riwayat.length === 0 ? (
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" }}>
          <Text style={{ color: "#888", fontWeight: "700" }}>Belum ada riwayat pembayaran.</Text>
        </View>
      ) : (
        riwayat.map((item) => {
          const showInvoiceButton = canDownloadInvoice(item) && onDownloadInvoice;
          const isDownloading = downloadingInvoiceId === item.pembayaran_terbaru?.id_pembayaran;

          return (
            <View
              key={item.id_tagihan}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 13 }}>{item.kode_invoice}</Text>
                  <Text style={{ fontSize: 11, color: "#888" }}>Kamar {item.kamar.nomor_kamar}</Text>
                  <Text style={{ fontSize: 11, color: "#888" }}>{formatDate(item.tanggal_jatuh_tempo, { day: "numeric", month: "long", year: "numeric" })}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontWeight: "900", color: "#1a1a1a", fontSize: 13 }}>
                    {formatRupiah(item.total_tagihan)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderRadius: 20,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: "#16a34a", fontWeight: "800", fontSize: 10 }}>Lunas</Text>
                  </View>
                </View>
              </View>

              {showInvoiceButton ? (
                <TouchableOpacity
                  onPress={() => onDownloadInvoice(item)}
                  disabled={isDownloading}
                  style={{
                    marginTop: 12,
                    borderRadius: 10,
                    backgroundColor: isDownloading ? "#93c5fd" : "#2563eb",
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>Download Invoice PDF</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </>
  );
};
