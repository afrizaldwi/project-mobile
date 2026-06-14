import type { PaginationMeta } from "./pagination";

export interface AdminTagihanSummary {
  total: number;
  lunas: number;
  belum: number;
  telat: number;
  dibatalkan: number;
}

export interface AdminTagihanListResponse {
  data: TagihanReminderItem[];
  meta: PaginationMeta;
  summary: AdminTagihanSummary;
}

export interface AdminPendingPaymentsResponse {
  data: PendingPembayaranItem[];
  meta: PaginationMeta;
}

export interface PenyewaTagihanResponse {
  data: TagihanReminderItem[];
}

export interface TagihanReminderItem {
  id_tagihan: number;
  id_sewa: number;
  kode_invoice: string;
  tanggal_tagihan: string;
  tanggal_jatuh_tempo: string;
  total_tagihan: string | number;
  status_tagihan: "belum_bayar" | "pending" | "telat" | "lunas" | "dibatalkan" | string;
  pembayaran_terbaru?: PembayaranTerbaru | null;
  penyewa: {
    id: number | null;
    nama_lengkap: string | null;
    email: string | null;
    no_hp: string | null;
  };
  kamar: {
    id_kamar: number | null;
    nomor_kamar: string | null;
  };
  peringatan: {
    aktif: boolean;
    status: "akan_jatuh_tempo" | "terlambat" | null;
    hari_tersisa: number | null;
    judul: string | null;
    pesan: string | null;
  };
  whatsapp: {
    enabled: boolean;
    phone: string;
    message: string;
    url: string | null;
  };
}

export interface PembayaranTerbaru {
  id_pembayaran: number;
  tanggal_bayar: string;
  jumlah_bayar: string | number;
  metode_pembayaran: string;
  bukti_bayar: string | null;
  bukti_bayar_url: string | null;
  status_verifikasi: "pending" | "diterima" | "ditolak";
  catatan_admin: string | null;
}

export interface PendingPembayaranItem {
  id_pembayaran: number;
  id_tagihan: number;
  tanggal_bayar: string;
  jumlah_bayar: string | number;
  metode_pembayaran: string;
  bukti_bayar: string | null;
  bukti_bayar_url: string | null;
  status_verifikasi: "pending" | "diterima" | "ditolak";
  catatan_admin: string | null;
  tagihan: TagihanReminderItem | null;
}

export interface NotifikasiItem {
  id: number;
  id_tagihan: number;
  role_target: "admin" | "penyewa";
  tipe: string;
  judul: string;
  pesan: string;
  is_read: boolean;
  created_at: string;
  tagihan: TagihanReminderItem | null;
}
