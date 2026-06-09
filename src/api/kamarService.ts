import { apiClient } from "@/api/client";
import type {
    Kamar,
    KamarApiItem,
    KamarListParams,
    KamarListResponse,
    KamarPayload,
    KamarStatus,
    KamarTersedia,
} from "@/types/kamar";
import type { PaginationMeta } from "@/types/pagination";
import { normalizeStorageUrl } from "@/utils/storageUrl";

type KamarListApiResponse = {
    data: KamarApiItem[];
    meta: PaginationMeta;
    total: number;
    tersedia: number;
    terisi: number;
    perbaikan: number;
};

export type KamarSyncPageResponse = {
    data: KamarApiItem[];
    meta: PaginationMeta;
};

type KamarItemApiResponse = {
    data: KamarApiItem;
};

type KamarTersediaApiResponse = {
    data: KamarApiItem[];
};

const KAMAR_PATH = "/admin/kamar";
const KAMAR_TERSEDIA_PATH = "/admin/kamar/tersedia";
const KAMAR_STATUSES: readonly KamarStatus[] = ["tersedia", "terisi", "perbaikan"];

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireNumber(record: Record<string, unknown>, key: string): number {
    const value = record[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Respons kamar tidak valid: ${key} harus berupa angka.`);
    }
    return value;
}

function requireNullableNumber(record: Record<string, unknown>, key: string): number | null {
    const value = record[key];
    if (value === null) return null;
    return requireNumber(record, key);
}

function requireString(record: Record<string, unknown>, key: string): string {
    const value = record[key];
    if (typeof value !== "string") {
        throw new Error(`Respons kamar tidak valid: ${key} harus berupa teks.`);
    }
    return value;
}

function parseKamarApiItem(value: unknown): KamarApiItem {
    if (!isRecord(value)) {
        throw new Error("Respons kamar tidak valid: item kamar harus berupa objek.");
    }

    const status = requireString(value, "status_kamar");
    if (!KAMAR_STATUSES.includes(status as KamarStatus)) {
        throw new Error("Respons kamar tidak valid: status_kamar tidak dikenal.");
    }

    const fotoKamar = value.foto_kamar;
    if (fotoKamar !== null && typeof fotoKamar !== "string") {
        throw new Error("Respons kamar tidak valid: foto_kamar harus berupa teks atau null.");
    }

    return {
        id_kamar: requireNumber(value, "id_kamar"),
        nomor_kamar: requireString(value, "nomor_kamar"),
        fasilitas: requireString(value, "fasilitas"),
        harga_bulanan: requireString(value, "harga_bulanan"),
        luas_kamar: requireString(value, "luas_kamar"),
        foto_kamar: fotoKamar,
        status_kamar: status as KamarStatus,
        created_at: requireString(value, "created_at"),
        updated_at: requireString(value, "updated_at"),
    };
}

function normalizeKamar(item: KamarApiItem): Kamar {
    if (!/^\d+(?:\.\d+)?$/.test(item.harga_bulanan)) {
        throw new Error("Respons kamar tidak valid: harga_bulanan harus berupa angka desimal.");
    }
    return item;
}

function parseKamarArray(value: unknown): Kamar[] {
    if (!Array.isArray(value)) {
        throw new Error("Respons kamar tidak valid: data harus berupa array.");
    }
    return value.map((item) => normalizeKamar(parseKamarApiItem(item)));
}

function parseKamarApiArray(value: unknown): KamarApiItem[] {
    if (!Array.isArray(value)) {
        throw new Error("Respons kamar tidak valid: data harus berupa array.");
    }
    return value.map(parseKamarApiItem);
}

function parsePaginationMeta(value: unknown): PaginationMeta {
    if (!isRecord(value)) {
        throw new Error("Respons kamar tidak valid: meta pagination tidak tersedia.");
    }

    return {
        current_page: requireNumber(value, "current_page"),
        per_page: requireNumber(value, "per_page"),
        total: requireNumber(value, "total"),
        last_page: requireNumber(value, "last_page"),
        from: requireNullableNumber(value, "from"),
        to: requireNullableNumber(value, "to"),
    };
}

function parseKamarListResponse(value: unknown): KamarListResponse {
    if (!isRecord(value)) {
        throw new Error("Respons daftar kamar tidak valid.");
    }

    return {
        data: parseKamarArray(value.data),
        meta: parsePaginationMeta(value.meta),
        total: requireNumber(value, "total"),
        tersedia: requireNumber(value, "tersedia"),
        terisi: requireNumber(value, "terisi"),
        perbaikan: requireNumber(value, "perbaikan"),
    };
}

function parseKamarItemResponse(value: unknown): Kamar {
    if (!isRecord(value)) {
        throw new Error("Respons detail kamar tidak valid.");
    }
    return normalizeKamar(parseKamarApiItem(value.data));
}

function mapToKamarTersedia(room: Kamar): KamarTersedia {
    return {
        id_kamar: room.id_kamar,
        nomor_kamar: room.nomor_kamar,
        harga_bulanan: room.harga_bulanan,
        fasilitas: room.fasilitas,
    };
}

export async function getKamarTersedia(): Promise<KamarTersedia[]> {
    const response = await apiClient.get<KamarTersediaApiResponse>(KAMAR_TERSEDIA_PATH);
    if (!isRecord(response.data)) {
        throw new Error("Respons kamar tersedia tidak valid.");
    }
    return parseKamarArray(response.data.data).map(mapToKamarTersedia);
}

export async function getKamarPage(
    params: KamarListParams,
    signal?: AbortSignal
): Promise<KamarListResponse> {
    const response = await apiClient.get<KamarListApiResponse>(KAMAR_PATH, {
        params,
        signal,
    });
    return parseKamarListResponse(response.data);
}

export async function getKamarSyncPage(
    params: KamarListParams,
    signal?: AbortSignal
): Promise<KamarSyncPageResponse> {
    const response = await apiClient.get<KamarListApiResponse>(KAMAR_PATH, { params, signal });
    if (!isRecord(response.data)) {
        throw new Error("Respons daftar kamar tidak valid.");
    }
    return {
        data: parseKamarApiArray(response.data.data),
        meta: parsePaginationMeta(response.data.meta),
    };
}

export async function getKamarById(id: number): Promise<Kamar> {
    const response = await apiClient.get<KamarItemApiResponse>(`${KAMAR_PATH}/${id}`);
    return parseKamarItemResponse(response.data);
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
    const response = await apiClient.post<KamarItemApiResponse>(KAMAR_PATH, formData);
    return parseKamarItemResponse(response.data);
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
    const response = await apiClient.post<KamarItemApiResponse>(`${KAMAR_PATH}/${id}`, formData);
    return parseKamarItemResponse(response.data);
}

export async function deleteKamar(id: number): Promise<void> {
    await apiClient.delete(`${KAMAR_PATH}/${id}`);
}

export function getImageUrl(path: string | null): string | null {
    return normalizeStorageUrl(path);
}

export function getStatusBadge(status: KamarStatus) {
    switch (status) {
        case "tersedia":
            return { label: "Tersedia", bgColor: "#16a34a", textColor: "#ffffff" };
        case "terisi":
            return { label: "Terisi", bgColor: "#dc2626", textColor: "#ffffff" };
        case "perbaikan":
            return { label: "Perbaikan", bgColor: "#d97706", textColor: "#ffffff" };
        default:
            return { label: "Tidak Dikenal", bgColor: "#6b7280", textColor: "#ffffff" };
    }
}

export function formatHarga(harga: string): string {
    const numericPrice = Number(harga);
    if (!Number.isFinite(numericPrice)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numericPrice);
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
