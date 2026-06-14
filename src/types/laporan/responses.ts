/**
 * Tipe data response yang diterima dari API Server untuk fitur Laporan Keuangan.
 * Semua interface di sini mewakili struktur data read-only hasil olahan database server.
 */

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
