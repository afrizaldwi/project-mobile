import type { PaginatedResponse } from "@/types/pagination";

export type KamarStatus = "tersedia" | "terisi" | "perbaikan";

export const KAMAR_STATUS_OPTIONS: { label: string; value: KamarStatus; color: string }[] = [
    { label: "Tersedia", value: "tersedia", color: "#16a34a" },
    { label: "Terisi", value: "terisi", color: "#dc2626" },
    { label: "Perbaikan", value: "perbaikan", color: "#d97706" },
];

export type Kamar = {
    id_kamar: number;
    nomor_kamar: string;
    luas_kamar: string;
    fasilitas: string;
    harga_bulanan: string;
    status_kamar: KamarStatus;
    foto_kamar: string | null;
    created_at: string;
    updated_at: string;
};

export type FotoPayload = {
    uri: string;
    name: string;
    type: string;
};

export type KamarPayload = {
    nomor_kamar: string;
    luas_kamar: string;
    fasilitas: string;
    harga_bulanan: string;
    status_kamar: KamarStatus;
    foto_kamar?: FotoPayload;
};

export type KamarListParams = {
    page: number;
    per_page: number;
    search?: string;
    status?: KamarStatus | "semua";
};

export type KamarStats = {
    total: number;
    tersedia: number;
    terisi: number;
    perbaikan: number;
};

export type KamarListResponse = PaginatedResponse<Kamar> & KamarStats;

/** Kamar yang bisa dipilih saat tambah penghuni */
export type KamarTersedia = Pick<
    Kamar,
    "id_kamar" | "nomor_kamar" | "harga_bulanan" | "fasilitas"
>;
