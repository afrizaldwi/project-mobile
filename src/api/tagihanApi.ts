import { apiClient } from "@/api/client";
import type { PaginationMeta } from "@/types/pagination";

export type AdminTagihanStatus =
  | "semua"
  | "belum_bayar"
  | "lunas"
  | "telat"
  | "dibatalkan";

export interface AdminTagihanQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: AdminTagihanStatus;
}

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

export interface AdminPendingPaymentsQuery {
  page?: number;
  per_page?: number;
  search?: string;
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

export const tagihanApi = {
  async getAdminTagihan(
    query: AdminTagihanQuery = {},
    signal?: AbortSignal
  ): Promise<AdminTagihanListResponse> {
    const search = query.search?.trim().slice(0, 100);
    const res = await apiClient.get<AdminTagihanListResponse>("/admin/tagihan", {
      params: { page: query.page, per_page: query.per_page, search: search || undefined, status: query.status },
      signal,
    });
    return res.data;
  },

  async getPenyewaTagihan(): Promise<TagihanReminderItem[]> {
    const res = await apiClient.get<PenyewaTagihanResponse>("/penyewa/tagihan");
    return res.data.data;
  },

  async uploadPaymentProof(idTagihan: number, payload: FormData) {
    const res = await apiClient.post(`/penyewa/tagihan/${idTagihan}/bayar`, payload);
    return res.data;
  },

  async getPendingPayments(
    query: AdminPendingPaymentsQuery = {},
    signal?: AbortSignal
  ): Promise<AdminPendingPaymentsResponse> {
    const search = query.search?.trim().slice(0, 100);
    const res = await apiClient.get<AdminPendingPaymentsResponse>("/admin/pembayaran/pending", {
      params: { page: query.page, per_page: query.per_page, search: search || undefined },
      signal,
    });
    return res.data;
  },

  async verifyPayment(idPembayaran: number, catatanAdmin?: string) {
    const res = await apiClient.patch(`/admin/pembayaran/${idPembayaran}/verify`, {
      catatan_admin: catatanAdmin || null,
    });
    return res.data;
  },

  async rejectPayment(idPembayaran: number, catatanAdmin?: string) {
    const res = await apiClient.patch(`/admin/pembayaran/${idPembayaran}/reject`, {
      catatan_admin: catatanAdmin || null,
    });
    return res.data;
  },

  async getNotifications(unread = false): Promise<NotifikasiItem[]> {
    const res = await apiClient.get<{ data: NotifikasiItem[] }>("/notifikasi", {
      params: unread ? { unread: 1 } : {},
    });
    return res.data.data;
  },

  async markNotificationAsRead(idNotifikasi: number) {
    const res = await apiClient.patch(`/notifikasi/${idNotifikasi}/read`);
    return res.data;
  },

  async runDueDateCheck() {
    const res = await apiClient.post("/admin/tagihan/check-jatuh-tempo");
    return res.data;
  },
};
