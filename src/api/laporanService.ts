import { apiClient } from "./client";

export interface Periode {
    bulan: number;
    tahun: number;
}

export interface LaporanSummary {
    total_pemasukan: number;
    total_pengeluaran: number;
    laba_bersih: number;
    tagihan_belum_bayar: number;
}

export interface PembayaranTerbaru {
    id_pembayaran: number;
    nama_lengkap: string | null;
    kode_invoice: string | null;
    tanggal_bayar: string;
    jumlah_bayar: number;
    metode_pembayaran: string;
    status_verifikasi: string;
}

export interface PengeluaranItem {
    id_pengeluaran: number;
    judul_pengeluaran: string;
    deskripsi: string | null;
    jumlah_pengeluaran: number;
    tanggal_pengeluaran: string;
    pencatat?: {
        id: number;
        nama_lengkap: string;
    } | null;
}

export interface LaporanKeuanganResponse {
    periode: Periode;
    summary: LaporanSummary;
    pembayaran_terbaru: PembayaranTerbaru[];
    pengeluaran_terbaru: PengeluaranItem[];
}

export interface CreatePengeluaranPayload {
    judul_pengeluaran: string;
    deskripsi?: string;
    jumlah_pengeluaran: number;
    tanggal_pengeluaran: string;
}

export const laporanService = {
    async getLaporanKeuangan(bulan: number, tahun: number): Promise<LaporanKeuanganResponse> {
        const response = await apiClient.get<LaporanKeuanganResponse>("/admin/laporan-keuangan", {
            params: { bulan, tahun },
        });
        return response.data;
    },

    async getPengeluaran(bulan: number, tahun: number): Promise<PengeluaranItem[]> {
        const response = await apiClient.get<{ data: PengeluaranItem[] }>("/admin/pengeluaran", {
            params: { bulan, tahun },
        });
        return response.data.data;
    },

    async createPengeluaran(payload: CreatePengeluaranPayload): Promise<{ id_pengeluaran: number; message: string }> {
        const response = await apiClient.post<{ id_pengeluaran: number; message: string }>("/admin/pengeluaran", payload);
        return response.data;
    },

    async deletePengeluaran(idPengeluaran: number): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(`/admin/pengeluaran/${idPengeluaran}`);
        return response.data;
    },
};
