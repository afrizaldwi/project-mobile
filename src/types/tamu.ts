import type { PaginationMeta } from "@/types/pagination";

export interface AdminTamuItem {
    id_tamu: number;
    nama_tamu: string;
    no_hp_tamu: string;
    keperluan: string;
    waktu_berkunjung: string;
    id_user: number;
    nama_penghuni: string;
    nomor_kamar: string;
}

export interface AdminTamuListParams {
    page?: number;
    per_page?: number;
    search?: string;
    id_user?: number;
}

export interface GetAdminTamusOptions extends AdminTamuListParams {
    signal?: AbortSignal;
}

export interface AdminTamuSummary {
    total_tamu: number;
    total_penghuni_visited: number;
    tamu_today: number;
}

export interface AdminTamuListResponse {
    data: AdminTamuItem[];
    meta: PaginationMeta;
    summary: AdminTamuSummary;
}

export interface PenyewaTamuListResponse {
    status: "success";
    data: AdminTamuItem[];
}
