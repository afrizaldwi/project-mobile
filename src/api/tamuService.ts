import { apiClient } from "@/api/client";
import type { Tamu } from "@/types";
import type {
    AdminTamuListParams,
    AdminTamuListResponse,
    GetAdminTamusOptions,
    PenghuniAktif,
    PenyewaTamuListResponse,
} from "@/types/tamu";

// ============================================================
// Tipe data payload untuk setiap operasi
// ============================================================
export interface CreateTamuPayload {
    nama_tamu: string;
    no_hp_tamu: string;
    keperluan: string;
    id_user?: number;
}

// ============================================================
// Factory Method: createTamuService
// Terinspirasi dari pola create_app() di Flask-Factory.
// Fungsi ini bertindak sebagai "pabrik" yang merakit semua
// metode API Tamu menjadi satu objek service yang siap pakai.
// ============================================================
export const createTamuService = (client = apiClient) => {
    return {
        // --- Metode untuk Admin ---
        getAdminTamus: async (
            options: GetAdminTamusOptions = {}
        ): Promise<AdminTamuListResponse> => {
            const trimmedSearch = options.search?.trim().slice(0, 100);
            const params: AdminTamuListParams = {
                page: options.page,
                per_page: options.per_page,
                search: trimmedSearch || undefined,
                id_user: options.id_user,
            };
            const response = await client.get<AdminTamuListResponse>("/admin/tamu", {
                params,
                signal: options.signal,
            });
            return response.data;
        },

        createAdminTamu: async (payload: CreateTamuPayload): Promise<void> => {
            await client.post("/admin/tamu", payload);
        },

        deleteAdminTamu: async (id: number): Promise<void> => {
            await client.delete(`/admin/tamu/${id}`);
        },

        getPenghuniAktif: async (): Promise<PenghuniAktif[]> => {
            const response = await client.get<{ data: PenghuniAktif[] }>("/admin/tamu/penghuni-aktif");
            return response.data.data;
        },

        // --- Metode untuk Penyewa ---
        getPenyewaTamus: async (): Promise<Tamu[]> => {
            const response = await client.get<PenyewaTamuListResponse>("/penyewa/tamu");
            return response.data.data;
        },

        createPenyewaTamu: async (payload: CreateTamuPayload): Promise<void> => {
            await client.post("/penyewa/tamu", payload);
        },
    };
};

// Instance default yang di-export agar semua screen bisa langsung import
export const tamuService = createTamuService();
