import type { Penghuni } from "@/types/penghuni";
import type { PerpanjangPayload, PerpanjangResponse } from "@/types/sewa";
import { apiClient } from "./client";
import type { AxiosInstance } from "axios";

export function createSewaService(client: AxiosInstance = apiClient) {
    const BASE_PATH = "/admin/sewa";

    async function fetchAktif(): Promise<Penghuni[]> {
        const res = await client.get(BASE_PATH);
        return res.data.data ?? [];
    }

    async function fetchDetail(id: number): Promise<Penghuni> {
        const res = await client.get(`${BASE_PATH}/${id}`);
        return res.data.data;
    }

    async function perpanjang(id: number, payload: PerpanjangPayload): Promise<PerpanjangResponse> {
        const res = await client.patch<PerpanjangResponse>(`${BASE_PATH}/${id}/perpanjang`, payload);
        return res.data;
    }

    return { fetchAktif, fetchDetail, perpanjang };
}

export const sewaService = createSewaService();
