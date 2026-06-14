import type { AdminPenghuniApiStatus } from "./responses";

/**
 * Tipe data request payload dan query parameters ke API Server untuk fitur Data Penghuni.
 */

export interface AdminPenghuniListParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: AdminPenghuniApiStatus;
}

export interface GetAdminPenghuniOptions extends AdminPenghuniListParams {
    signal?: AbortSignal;
}

