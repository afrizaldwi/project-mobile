/**
 * Tipe data request (payload) yang dikirim ke API Server untuk fitur Laporan Keuangan.
 * Berisi field minimal yang dibutuhkan server untuk memproses data baru/perubahan.
 */

export interface CreatePengeluaranPayload {
    judul_pengeluaran: string;
    deskripsi?: string;
    jumlah_pengeluaran: number;
    tanggal_pengeluaran: string;
}
