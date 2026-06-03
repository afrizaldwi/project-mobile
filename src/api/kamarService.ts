import axios from "axios";

import { apiClient } from "@/api/client";
import { normalizeStorageUrl } from "@/utils/storageUrl";
import type {
    Kamar,
    KamarListResponse,
    KamarPayload,
    KamarStatus,
    KamarTersedia,
} from "@/types/kamar";

const KAMAR_LIST_PATHS = ["/admin/kamar", "/admin/laporan/kamar"] as const;
const KAMAR_TERSEDIA_PATHS = [
    "/admin/kamar/tersedia",
    "/admin/laporan/kamar/tersedia",
] as const;

function extractKamarList(payload: unknown): Kamar[] {
    if (!payload || typeof payload !== "object") {
        return [];
    }

    const body = payload as Record<string, unknown>;

    if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
        const nested = extractKamarList(body.data);
        if (nested.length > 0) {
            return nested;
        }
    }

    if (Array.isArray(body.data)) {
        return body.data as Kamar[];
    }

    if (Array.isArray(body.kamar)) {
        return body.kamar as Kamar[];
    }

    if (Array.isArray(body.rooms)) {
        return body.rooms as Kamar[];
    }

    if (Array.isArray(payload)) {
        return payload as Kamar[];
    }

    return [];
}

function isKamarTersedia(room: Kamar): boolean {
    const status = String(room.status_kamar ?? "")
        .toLowerCase()
        .trim();

    if (!status) {
        return true;
    }

    return (
        status === "tersedia" ||
        status === "available" ||
        status === "kosong" ||
        status === "vacant"
    );
}

function mapToKamarTersedia(room: Kamar): KamarTersedia {
    return {
        id_kamar: Number(room.id_kamar),
        nomor_kamar: String(room.nomor_kamar ?? ""),
        harga_bulanan: Number(room.harga_bulanan) || 0,
        fasilitas: room.fasilitas ?? "",
    };
}

export async function getKamarTersedia(): Promise<KamarTersedia[]> {
    for (const path of KAMAR_TERSEDIA_PATHS) {
        try {
            const res = await apiClient.get(path);
            const rooms = extractKamarList(res.data);

            const available = rooms.filter(
                (room) => room.id_kamar && (!room.status_kamar || isKamarTersedia(room))
            );

            if (available.length > 0) {
                return available.map(mapToKamarTersedia);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                continue;
            }
            throw error;
        }
    }

    const listResponse = await getAllKamar();
    const rooms = listResponse.data ?? [];

    const available = rooms.filter(
        (room) => room.id_kamar && isKamarTersedia(room)
    );

    return available.map(mapToKamarTersedia);
}

export async function getAllKamar(): Promise<KamarListResponse> {
    let lastError: unknown;

    for (const path of KAMAR_LIST_PATHS) {
        try {
            const res = await apiClient.get(path);
            const rooms = extractKamarList(res.data);

            if (rooms.length > 0 || typeof res.data === "object") {
                const body = res.data as Partial<KamarListResponse>;
                return {
                    data: rooms,
                    total: body.total ?? rooms.length,
                    tersedia:
                        body.tersedia ??
                        rooms.filter((r) => isKamarTersedia(r)).length,
                    terisi:
                        body.terisi ??
                        rooms.filter((r) => String(r.status_kamar).toLowerCase() === "terisi")
                            .length,
                    perbaikan:
                        body.perbaikan ??
                        rooms.filter((r) => String(r.status_kamar).toLowerCase() === "perbaikan")
                            .length,
                };
            }
        } catch (error) {
            lastError = error;
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                continue;
            }
            throw error;
        }
    }

    throw lastError ?? new Error("Endpoint daftar kamar tidak ditemukan.");
}

export async function getKamarById(id: number): Promise<Kamar> {
    for (const base of KAMAR_LIST_PATHS) {
        try {
            const res = await apiClient.get<{ data: Kamar }>(`${base}/${id}`);
            return res.data.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                continue;
            }
            throw error;
        }
    }
    throw new Error("Kamar tidak ditemukan.");
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
    const res = await apiClient.post<{ data: Kamar }>("/admin/kamar", formData);
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
    const res = await apiClient.post<{ data: Kamar }>(`/admin/kamar/${id}`, formData);
    return res.data.data;
}

export async function deleteKamar(id: number): Promise<void> {
    await apiClient.delete(`/admin/kamar/${id}`);
}

export function getImageUrl(path: string | null): string | null {
    return normalizeStorageUrl(path);
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
        case "perbaikan":
            return {
                label: "Perbaikan",
                bgColor: "#d97706",
                textColor: "#ffffff",
            };
        default:
            return {
                label: "Tidak Dikenal",
                bgColor: "#6b7280",
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
