import type { Keluhan } from "@/types";
import type { PaginationMeta } from "@/types/pagination";

export type AdminKeluhanStatus = "semua" | "pending" | "proses" | "selesai";

export interface AdminKeluhanListParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: AdminKeluhanStatus;
}

export interface AdminKeluhanSummary {
    total: number;
    pending: number;
    proses: number;
    selesai: number;
}

export interface AdminKeluhanListResponse {
    data: Keluhan[];
    meta: PaginationMeta;
    summary: AdminKeluhanSummary;
}
