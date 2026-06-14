/**
 * Tipe data form state untuk input form lokal di sisi UI (React Native).
 * Angka dan tanggal ditampung sebagai string agar input text field berfungsi optimal.
 */

export interface PengeluaranFormState {
    judul_pengeluaran: string;
    deskripsi: string;
    jumlah_pengeluaran: string;
    tanggal_pengeluaran: string;
}
