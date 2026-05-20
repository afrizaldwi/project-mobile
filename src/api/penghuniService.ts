import { apiClient } from "./client";
import { Penghuni, PerpanjangPayload } from "@/types/penghuni";

export const PenghuniCommand = {

    fetchAktif: async (): Promise<Penghuni[]> => {
        const res = await apiClient.get("/admin/sewa");
        return res.data.data ?? [];
    },

    fetchDetail: async (id: number): Promise<Penghuni> => {
        const res = await apiClient.get(`/admin/sewa/${id}`);
        return res.data.data;
    },

    perpanjang: async (id: number, payload: PerpanjangPayload): Promise<void> => {
        await apiClient.patch(`/admin/sewa/${id}/perpanjang`, payload);
    },
};