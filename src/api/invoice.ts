// src/api/invoice.ts
import * as Sharing from "expo-sharing";

import { apiClient } from "@/api/client";
import { getToken } from "@/auth/tokenStorage";

export type InvoiceItem = {
    id_pembayaran: number;
    id_tagihan: number;
    kode_invoice: string | null;
    tanggal_tagihan: string | null;
    tanggal_jatuh_tempo: string | null;
    tanggal_bayar: string | null;
    jumlah_bayar: string | number;
    total_tagihan: string | number;
    metode_pembayaran: string | null;
    status_verifikasi: "pending" | "diterima" | "ditolak";
    catatan_admin: string | null;
    penyewa: {
        nama_lengkap: string;
        email: string;
        no_hp?: string;
    };
    kamar: {
        nomor_kamar: string;
    };
    sewa?: Record<string, unknown>;
};

export const invoiceApi = {
    async getAdminInvoices(): Promise<InvoiceItem[]> {
        const response = await apiClient.get<{ data: InvoiceItem[] }>("/admin/invoices");
        return response.data.data;
    },

    async getPenyewaInvoices(): Promise<InvoiceItem[]> {
        const response = await apiClient.get<{ data: InvoiceItem[] }>("/penyewa/invoices");
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
    const fileName = `${kodeInvoice || "invoice"}.pdf`;

    // Dinamis import supaya bypass TypeScript type check
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("expo-file-system");

    const dir: string =
        FS.documentDirectory ??
        FS.cacheDirectory ??
        FS.temporaryDirectory ??
        "";

    if (!dir) throw new Error("Storage tidak tersedia di perangkat ini");

    const fileUri: string = dir + fileName;

    const result = await FS.downloadAsync(fullUrl, fileUri, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
        },
    });

    if (result.status !== 200) {
        throw new Error("Server gagal mengembalikan PDF");
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error("Sharing tidak tersedia");

    await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: `Invoice ${kodeInvoice}`,
        UTI: "com.adobe.pdf",
    });
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

export function buildCsvContent(invoices: InvoiceItem[]): string {
    const esc = (value: string | number | null | undefined) => {
        const str = String(value ?? "-");
        return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
        "Kode Invoice", "Nama Penyewa", "Email Penyewa", "No HP",
        "Nomor Kamar", "Tanggal Tagihan", "Jatuh Tempo", "Tanggal Bayar",
        "Metode Pembayaran", "Jumlah Bayar", "Status Pembayaran",
    ];

    const totalPembayaran = invoices.reduce(
        (total, inv) => total + Number(inv.jumlah_bayar || 0), 0
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

export async function exportCsvToShare(invoices: InvoiceItem[]) {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `laporan-transaksi-${today}.csv`;
    const csvContent = buildCsvContent(invoices);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const FS = require("expo-file-system");

    const dir: string =
        FS.documentDirectory ??
        FS.cacheDirectory ??
        FS.temporaryDirectory ??
        "";

    if (!dir) throw new Error("Storage tidak tersedia");

    const fileUri: string = dir + fileName;

    await FS.writeAsStringAsync(fileUri, csvContent, {
        encoding: "utf8",
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error("Sharing tidak tersedia");

    await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Laporan CSV",
    });
}