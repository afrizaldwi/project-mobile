import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { apiClient } from "@/api/client";
import { getToken } from "@/auth/tokenStorage";
import type { InvoiceListItemResponse } from "@/types/invoice";
import type { PaginatedResponse } from "@/types/pagination";

const getCurrentTimeMs = (): number =>
  globalThis.performance?.now?.() ?? Date.now();

export const invoiceApi = {
  async getAdminInvoices(): Promise<InvoiceListItemResponse[]> {
    const response =
      await apiClient.get<PaginatedResponse<InvoiceListItemResponse>>(
        "/admin/invoices",
      );

    return response.data.data;
  },

  async getPenyewaInvoices(): Promise<InvoiceListItemResponse[]> {
    const response =
      await apiClient.get<PaginatedResponse<InvoiceListItemResponse>>(
        "/penyewa/invoices",
      );

    return response.data.data;
  },

  async downloadAdminInvoicePdf(idPembayaran: number, kodeInvoice: string) {
    const baseUrl = apiClient.defaults.baseURL ?? "";
    const url = `${baseUrl}/admin/invoices/${idPembayaran}/pdf`;
    await downloadAndSharePdf(url, kodeInvoice);
  },

  async downloadPenyewaInvoicePdf(idPembayaran: number, kodeInvoice: string) {
    const baseUrl = apiClient.defaults.baseURL ?? "";
    const url = `${baseUrl}/penyewa/invoices/${idPembayaran}/pdf`;
    await downloadAndSharePdf(url, kodeInvoice);
  },
};

async function downloadAndSharePdf(fullUrl: string, kodeInvoice: string) {
  const token = await getToken();

  if (!token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
  }

  const fileName = `${kodeInvoice || "invoice"}.pdf`;

  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "";

  if (!dir) {
    throw new Error("Penyimpanan lokal tidak tersedia di perangkat ini.");
  }

  const fileUri = dir + fileName;

  const startedAt = getCurrentTimeMs();

  try {
    const result = await FileSystem.downloadAsync(fullUrl, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    const durationMs = getCurrentTimeMs() - startedAt;

    if (__DEV__) {
      console.info(
        `[PERF][invoice-pdf] invoice=${kodeInvoice} ` +
          `status=${result.status} ` +
          `duration=${durationMs.toFixed(2)}ms`,
      );
    }

    if (result.status !== 200) {
      throw new Error("Server gagal mengembalikan PDF");
    }

    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      throw new Error("Fitur berbagi file tidak tersedia di perangkat ini.");
    }

    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Invoice ${kodeInvoice}`,
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    const durationMs = getCurrentTimeMs() - startedAt;

    if (__DEV__) {
      console.warn(
        `[PERF][invoice-pdf] invoice=${kodeInvoice} ` +
          `failedAfter=${durationMs.toFixed(2)}ms`,
      );
    }

    throw error;
  }
}
export function buildCsvContent(invoices: InvoiceListItemResponse[]): string {
  const esc = (value: string | number | null | undefined) => {
    const str = String(value ?? "-");
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    "Kode Invoice",
    "Nama Penyewa",
    "Email Penyewa",
    "No HP",
    "Nomor Kamar",
    "Tanggal Tagihan",
    "Jatuh Tempo",
    "Tanggal Bayar",
    "Metode Pembayaran",
    "Jumlah Bayar",
    "Status Pembayaran",
  ];

  const totalPembayaran = invoices.reduce(
    (total, inv) => total + Number(inv.jumlah_bayar || 0),
    0,
  );

  const rows = invoices.map((inv) => [
    inv.kode_invoice || "-",
    inv.penyewa.nama_lengkap || "-",
    inv.penyewa.email || "-",
    inv.penyewa.no_hp || "-",
    inv.kamar.nomor_kamar || "-",
    inv.tanggal_tagihan || "-",
    inv.tanggal_jatuh_tempo || "-",
    inv.tanggal_bayar || "-",
    inv.metode_pembayaran || "-",
    inv.jumlah_bayar || 0,
    "Diterima",
  ]);

  const lines = [
    esc("Laporan Transaksi Pembayaran Kost"),
    "",
    esc("Ringkasan"),
    `${esc("Total Invoice")},${esc(invoices.length)}`,
    `${esc("Total Pembayaran Diterima")},${esc(totalPembayaran)}`,
    "",
    headers.map(esc).join(","),
    ...rows.map((row) => row.map(esc).join(",")),
  ];

  return "\uFEFF" + lines.join("\n");
}

export async function exportCsvToShare(invoices: InvoiceListItemResponse[]) {
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `laporan-transaksi-${today}.csv`;
  const csvContent = buildCsvContent(invoices);

  const dir =
    FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";

  if (!dir) {
    throw new Error("Storage tidak tersedia");
  }

  const fileUri = dir + fileName;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing tidak tersedia");

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: "Export Laporan CSV",
  });
}
