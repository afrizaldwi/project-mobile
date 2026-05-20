import { apiClient } from "@/api/client";
import { API_BASE_URL } from "@/constants/env";
import type { Kamar, KamarListResponse, KamarPayload, KamarStatus } from "@/types/kamar";

export async function getAllKamar(): Promise<KamarListResponse> {
    const res = await apiClient.get<KamarListResponse>("/admin/kamar");
    return res.data;
}

export async function getKamarById(id: number): Promise<Kamar> {
    const res = await apiClient.get<{ data: Kamar }>(`/admin/kamar/${id}`);
    return res.data.data;
}

export async function createKamar(payload: KamarPayload): Promise<Kamar> {
    const formData = new FormData();
    formData.append("nomor_kamar", payload.nomor_kamar);
    formData.append("luas_kamar", payload.luas_kamar);
    formData.append("fasilitas", payload.fasilitas);
    formData.append("harga_bulanan", payload.harga_bulanan);
    formData.append("status_kamar", payload.status_kamar);
    if (payload.foto_kamar) {
        formData.append("foto_kamar", payload.foto_kamar as any);
    }
    const res = await apiClient.post<{ data: Kamar }>("/admin/kamar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
}

export async function updateKamar(id: number, payload: KamarPayload): Promise<Kamar> {
    const formData = new FormData();
    formData.append("nomor_kamar", payload.nomor_kamar);
    formData.append("luas_kamar", payload.luas_kamar);
    formData.append("fasilitas", payload.fasilitas);
    formData.append("harga_bulanan", payload.harga_bulanan);
    formData.append("status_kamar", payload.status_kamar);
    formData.append("_method", "PATCH");
    if (payload.foto_kamar) {
        formData.append("foto_kamar", payload.foto_kamar as any);
    }
    const res = await apiClient.post<{ data: Kamar }>(`/admin/kamar/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
}

export async function deleteKamar(id: number): Promise<void> {
    await apiClient.delete(`/admin/kamar/${id}`);
}

export function getImageUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${base}/storage/${path.replace(/^\/+/, "")}`;
}

export function getStatusBadge(status: KamarStatus) {
    switch (status) {
        case "tersedia":
            return {
                label: "Tersedia",
                bgColor: "#16a34a",
                textColor: "#ffffff",
            };
        case "terisi":
            return {
                label: "Terisi",
                bgColor: "#dc2626",
                textColor: "#ffffff",
            };
    }
}

export function formatHarga(harga: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(harga);
}

export function formatTanggal(iso: string): string {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}