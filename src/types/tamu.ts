import type { PaginationMeta } from "@/types/pagination";
import type { Tamu } from "@/types";

export interface PenghuniAktif {
    id_user: number;
    nama_penghuni: string;
    email: string;
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
    data: Tamu[];
    meta: PaginationMeta;
    summary: AdminTamuSummary;
}

export interface PenyewaTamuListResponse {
    status: "success";
    data: Tamu[];
}
