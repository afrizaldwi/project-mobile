import { apiClient } from "@/api/client";
import type {
  AdminPendingPaymentsResponse,
  AdminTagihanListResponse,
  NotifikasiItem,
  PenyewaTagihanResponse,
  TagihanReminderItem,
} from "@/types/tagihan";

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

export interface AdminPendingPaymentsQuery {
  page?: number;
  per_page?: number;
  search?: string;
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
