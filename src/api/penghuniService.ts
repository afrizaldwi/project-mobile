/**
 * API service untuk fitur Data Penghuni.
 * Menggunakan pola object service yang konsisten (tidak lagi campur fungsi standalone).
 * Semua method dibungkus dalam satu object PenghuniService.
 */

import type {
    AdminPenghuniListResponse,
    GetAdminPenghuniOptions,
    Penghuni,
    PerpanjangPayload,
    PerpanjangResponse,
} from "@/types/penghuni";
import { apiClient } from "./client";

const PENGHUNI_PATH = "/admin/penghuni";
const SEWA_PATH = "/admin/sewa";

export const PenghuniService = {
    /**
     * Ambil daftar penghuni dengan pagination, filter, dan pencarian.
     */
    async getPage(
        options: GetAdminPenghuniOptions = {},
    ): Promise<AdminPenghuniListResponse> {
        const trimmedSearch = options.search?.trim().slice(0, 100);
        const response = await apiClient.get<AdminPenghuniListResponse>(PENGHUNI_PATH, {
            params: {
                page: options.page,
                per_page: options.per_page,
                search: trimmedSearch || undefined,
                status: options.status,
            },
            signal: options.signal,
        });
        return response.data;
    },

    /**
     * Selesaikan / arsipkan sewa penghuni aktif menjadi alumni.
     */
    async finish(idSewa: number): Promise<string | undefined> {
        const response = await apiClient.patch<{ message?: string }>(
            `${PENGHUNI_PATH}/${idSewa}/selesaikan`,
        );
        return response.data.message;
    },

    /**
     * Ambil semua penghuni aktif (untuk keperluan dropdown, dll).
     */
    async fetchAktif(): Promise<Penghuni[]> {
        const response = await apiClient.get(`${SEWA_PATH}`);
        return response.data.data ?? [];
    },

    /**
     * Ambil detail satu penghuni berdasarkan ID sewa.
     */
    async fetchDetail(id: number): Promise<Penghuni> {
        const response = await apiClient.get(`${SEWA_PATH}/${id}`);
        return response.data.data;
    },

    /**
     * Perpanjang masa sewa penghuni.
     */
    async perpanjang(id: number, payload: PerpanjangPayload): Promise<PerpanjangResponse> {
        const response = await apiClient.patch<PerpanjangResponse>(
            `${SEWA_PATH}/${id}/perpanjang`,
            payload,
        );
        return response.data;
    },
};

// --- Backward-compat exports agar file lain (penghuniSync, dll) tidak perlu diubah ---
/** @deprecated Gunakan PenghuniService.getPage() */
export async function getAdminPenghuniPage(
    options: GetAdminPenghuniOptions = {},
): Promise<AdminPenghuniListResponse> {
    return PenghuniService.getPage(options);
}

/** @deprecated Gunakan PenghuniService.finish() */
export async function finishAdminPenghuni(idSewa: number): Promise<string | undefined> {
    return PenghuniService.finish(idSewa);
}