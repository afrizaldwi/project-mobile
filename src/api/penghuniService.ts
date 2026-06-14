import {
    type AdminPenghuniListParams,
    type AdminPenghuniListResponse,
    type GetAdminPenghuniOptions,
} from "@/types/penghuni";
import { apiClient } from "./client";
import type { AxiosInstance } from "axios";

const ADMIN_PENGHUNI_PATH = "/admin/penghuni";

export async function getAdminPenghuniPage(
    options: GetAdminPenghuniOptions = {}
): Promise<AdminPenghuniListResponse> {
    const trimmedSearch = options.search?.trim().slice(0, 100);
    const params: AdminPenghuniListParams = {
        page: options.page,
        per_page: options.per_page,
        search: trimmedSearch || undefined,
        status: options.status,
    };
    const response = await apiClient.get<AdminPenghuniListResponse>(ADMIN_PENGHUNI_PATH, {
        params,
        signal: options.signal,
    });
    return response.data;
}

export async function finishAdminPenghuni(idSewa: number): Promise<string | undefined> {
    const response = await apiClient.patch<{ message?: string }>(`${ADMIN_PENGHUNI_PATH}/${idSewa}/selesaikan`);
    return response.data.message;
}

export function createPenghuniService(client: AxiosInstance = apiClient) {
    return {
        getAdminPenghuniPage,
        finishAdminPenghuni,
    };
}

export const penghuniService = createPenghuniService();

