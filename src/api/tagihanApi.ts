import { apiClient } from "@/api/client";

export interface TagihanReminderItem {
  id_tagihan: number;
  id_sewa: number;
  kode_invoice: string;
  tanggal_tagihan: string;
  tanggal_jatuh_tempo: string;
  total_tagihan: string | number;
  status_tagihan: string;
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
  async getAdminTagihan(): Promise<TagihanReminderItem[]> {
    const res = await apiClient.get<{ data: TagihanReminderItem[] }>("/admin/tagihan");
    return res.data.data;
  },

  async getPenyewaTagihan(): Promise<TagihanReminderItem[]> {
    const res = await apiClient.get<{ data: TagihanReminderItem[] }>("/penyewa/tagihan");
    return res.data.data;
  },

  async uploadPaymentProof(idTagihan: number, payload: FormData) {
    const res = await apiClient.post(`/penyewa/tagihan/${idTagihan}/bayar`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getPendingPayments(): Promise<PendingPembayaranItem[]> {
    const res = await apiClient.get<{ data: PendingPembayaranItem[] }>(
      "/admin/pembayaran/pending"
    );
    return res.data.data;
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