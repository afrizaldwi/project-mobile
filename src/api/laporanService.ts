/**
 * API service untuk fitur Laporan Keuangan.
 * Bertanggung jawab hanya pada request dan response ke/dari server.
 * Semua type definitions dipindahkan ke @/types/laporan.
 */

import type {
    CreatePengeluaranPayload,
    LaporanKeuanganResponse,
    PengeluaranItem,
} from "@/types/laporan";
import { apiClient } from "./client";

// Re-export types agar file lain yang sudah import dari sini tidak perlu diubah
export type {
    CreatePengeluaranPayload,
    LaporanKeuanganResponse,
    LaporanSummary,
    PembayaranTerbaru,
    PengeluaranItem,
    PengeluaranFormState,
    Periode,
} from "@/types/laporan";

const BASE_PATH = "/admin";

export const laporanService = {
    async getLaporanKeuangan(bulan: number, tahun: number): Promise<LaporanKeuanganResponse> {
        const response = await apiClient.get<LaporanKeuanganResponse>(
            `${BASE_PATH}/laporan-keuangan`,
            { params: { bulan, tahun } },
        );
        return response.data;
    },

    async getPengeluaran(bulan: number, tahun: number): Promise<PengeluaranItem[]> {
        const response = await apiClient.get<{ data: PengeluaranItem[] }>(
            `${BASE_PATH}/pengeluaran`,
            { params: { bulan, tahun } },
        );
        return response.data.data;
    },

    async createPengeluaran(
        payload: CreatePengeluaranPayload,
    ): Promise<{ id_pengeluaran: number; message: string }> {
        const response = await apiClient.post<{ id_pengeluaran: number; message: string }>(
            `${BASE_PATH}/pengeluaran`,
            payload,
        );
        return response.data;
    },

    async deletePengeluaran(idPengeluaran: number): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(
            `${BASE_PATH}/pengeluaran/${idPengeluaran}`,
        );
        return response.data;
    },
};
