import {
    Penghuni,
    PerpanjangPayload,
    type AdminPenghuniListParams,
    type AdminPenghuniListResponse,
    type GetAdminPenghuniOptions,
    type PerpanjangResponse,
} from "@/types/penghuni";
import { apiClient } from "./client";

const ADMIN_PENGHUNI_PATH = "/admin/penghuni";

export async function getAdminPenghuniPage(
    options: GetAdminPenghuniOptions = {}
): Promise<AdminPenghuniListResponse> {
    const trimmedSearch = options.search?.trim().slice(0, 100);
    const params: AdminPenghuniListParams = {
        page: options.page,
        per_page: options.per_page,
        search: trimmedSearch || undefined,
        status: options.status,
    };
    const response = await apiClient.get<AdminPenghuniListResponse>(ADMIN_PENGHUNI_PATH, {
        params,
        signal: options.signal,
    });
    return response.data;
}

export async function finishAdminPenghuni(idSewa: number): Promise<string | undefined> {
    const response = await apiClient.patch<{ message?: string }>(`${ADMIN_PENGHUNI_PATH}/${idSewa}/selesaikan`);
    return response.data.message;
}

export const PenghuniCommand = {

    fetchAktif: async (): Promise<Penghuni[]> => {
        const res = await apiClient.get("/admin/sewa");
        return res.data.data ?? [];
    },

    fetchDetail: async (id: number): Promise<Penghuni> => {
        const res = await apiClient.get(`/admin/sewa/${id}`);
        return res.data.data;
    },

    perpanjang: async (id: number, payload: PerpanjangPayload): Promise<PerpanjangResponse> => {
        const res = await apiClient.patch<PerpanjangResponse>(`/admin/sewa/${id}/perpanjang`, payload);
        return res.data;
    },
};