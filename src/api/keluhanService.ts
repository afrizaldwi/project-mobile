import { apiClient } from "@/api/client";
import { getToken } from "@/auth/tokenStorage";
import { API_BASE_URL } from "@/constants/env";
import type { Keluhan } from "@/types";
import { downloadAndShareFile } from "@/utils/fileDownload";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

// ============================================================
// Tipe data payload untuk setiap operasi
// ============================================================
export interface CreateKeluhanPayload {
    judul_keluhan: string;
    deskripsi_keluhan: string;
    images?: ImagePicker.ImagePickerAsset[];
}

export interface UpdateStatusKeluhanPayload {
    status_keluhan: "pending" | "proses" | "selesai";
}

export interface ExportKeluhanOptions {
    format: "csv" | "json";
    status?: string;
}

// ============================================================
// Factory Method: createKeluhanService
// Terinspirasi dari pola create_app() di Flask-Factory.
// Fungsi ini bertindak sebagai "pabrik" yang merakit semua
// metode API Keluhan menjadi satu objek service yang siap pakai.
// ============================================================
export const createKeluhanService = (client = apiClient) => {
    return {
        // --- Metode untuk Admin ---
        getAdminKeluhans: async (): Promise<Keluhan[]> => {
            const response = await client.get<{ data: Keluhan[] }>("/admin/keluhan");
            return response.data.data;
        },

        deleteAdminKeluhan: async (id: number): Promise<void> => {
            await client.delete(`/admin/keluhan/${id}`);
        },

        updateStatusKeluhan: async (
            id: number,
            payload: UpdateStatusKeluhanPayload
        ): Promise<void> => {
            await client.patch(`/admin/keluhan/${id}/status`, payload);
        },

        exportAdminKeluhans: async (options: Omit<ExportKeluhanOptions, "token">): Promise<void> => {
            const token = await getToken();
            const params = new URLSearchParams({ format: options.format });

            if (options.status && options.status !== "semua") {
                params.set("status", options.status);
            }
            if (token) {
                params.set("token", token);
            }

            const url = `${API_BASE_URL}/admin/laporan/keluhan?${params.toString()}`;
            const dateLabel = new Date().toISOString().slice(0, 10);
            const statusLabel = options.status && options.status !== "semua" ? options.status : "semua";
            const filename = `laporan-keluhan-${statusLabel}-${dateLabel}.${options.format}`;
            const mimeType = options.format === "csv" ? "text/csv" : "application/json";

            await downloadAndShareFile({
                url,
                filename,
                mimeType,
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
        },

        // --- Metode untuk Penyewa ---
        getPenyewaKeluhans: async (): Promise<Keluhan[]> => {
            const response = await client.get<{ data: Keluhan[] }>("/penyewa/keluhan");
            return response.data.data;
        },

        createPenyewaKeluhan: async (payload: CreateKeluhanPayload): Promise<void> => {
            const formData = new FormData();
            formData.append("judul_keluhan", payload.judul_keluhan);
            formData.append("deskripsi_keluhan", payload.deskripsi_keluhan);

            if (payload.images) {
                payload.images.forEach((image) => {
                    const uriParts = image.uri.split(".");
                    const fileType = uriParts[uriParts.length - 1];
                    const mimeType = image.mimeType || `image/${fileType}`;

                    formData.append("foto_kerusakan[]", {
                        uri: Platform.OS === "android" ? image.uri : image.uri.replace("file://", ""),
                        name: `photo.${fileType}`,
                        type: mimeType,
                    } as any);
                });
            }

            await client.post("/penyewa/keluhan", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
    };
};

// Instance default yang di-export agar semua screen bisa langsung import
export const keluhanService = createKeluhanService();
