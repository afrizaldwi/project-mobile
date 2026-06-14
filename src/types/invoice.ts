export interface InvoicePenyewaResponse {
  id: number;
  nama_lengkap: string;
  email: string;
  no_hp: string;
  alamat_asal: string | null;
}

export interface InvoiceKamarResponse {
  id_kamar: number;
  nomor_kamar: string;
  luas_kamar: string | null;
  fasilitas: string | null;
  harga_bulanan: string;
}

export interface InvoiceSewaResponse {
  id_sewa: number;
  tanggal_masuk: string;
  tanggal_keluar: string | null;
  durasi_sewa_bulan: number;
  harga_deal: string;
}

export interface InvoiceListItemResponse {
  id_pembayaran: number;
  id_tagihan: number;
  kode_invoice: string;
  tanggal_tagihan: string;
  tanggal_jatuh_tempo: string;
  tanggal_bayar: string;
  jumlah_bayar: string;
  total_tagihan: string;
  metode_pembayaran: string;
  status_verifikasi: "diterima";
  catatan_admin: string | null;
  penyewa: InvoicePenyewaResponse;
  kamar: InvoiceKamarResponse;
  sewa: InvoiceSewaResponse;
}
