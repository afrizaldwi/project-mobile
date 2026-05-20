export interface Invoice {
  id: string;
  nomor_invoice: string;
  penghuni_id: string;
  penghuni_nama: string;
  kamar_nomor: string;
  periode_bulan: string; // format: "2025-01"
  tanggal_jatuh_tempo: string;
  tanggal_bayar?: string;
  total_tagihan: number;
  status: 'belum_bayar' | 'sudah_bayar' | 'terlambat';
  items: InvoiceItem[];
}

export interface InvoiceItem {
  keterangan: string;
  jumlah: number;
}

export interface LaporanKeuangan {
  periode: string;
  total_pemasukan: number;
  total_tagihan: number;
  total_lunas: number;
  total_belum_bayar: number;
  total_terlambat: number;
  transaksi: Transaksi[];
}

export interface Transaksi {
  id: string;
  invoice_id: string;
  nomor_invoice: string;
  penghuni_nama: string;
  kamar_nomor: string;
  jumlah: number;
  tanggal: string;
  metode_bayar: string;
  status: 'sukses' | 'gagal' | 'pending';
}