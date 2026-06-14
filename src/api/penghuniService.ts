import type { AxiosInstance } from "axios";

import type {
  AdminPenghuniListParams,
  AdminPenghuniListResponse,
  GetAdminPenghuniOptions,
} from "@/types/penghuni";
import { apiClient } from "./client";

const ADMIN_PENGHUNI_PATH = "/admin/penghuni";

export function createPenghuniService(client: AxiosInstance = apiClient) {
  async function getPage(
    options: GetAdminPenghuniOptions = {},
  ): Promise<AdminPenghuniListResponse> {
    const trimmedSearch = options.search?.trim().slice(0, 100);

    const params: AdminPenghuniListParams = {
      page: options.page,
      per_page: options.per_page,
      search: trimmedSearch || undefined,
      status: options.status,
    };

    const response = await client.get<AdminPenghuniListResponse>(
      ADMIN_PENGHUNI_PATH,
      {
        params,
        signal: options.signal,
      },
    );

    return response.data;
  }

  async function finish(idSewa: number): Promise<string | undefined> {
    const response = await client.patch<{ message?: string }>(
      `${ADMIN_PENGHUNI_PATH}/${idSewa}/selesaikan`,
    );

    return response.data.message;
  }

  return {
    getPage,
    finish,
    getAdminPenghuniPage: getPage,
    finishAdminPenghuni: finish,
  };
}

export const penghuniService = createPenghuniService();
export const PenghuniService = penghuniService;

export async function getAdminPenghuniPage(
  options: GetAdminPenghuniOptions = {},
): Promise<AdminPenghuniListResponse> {
  return penghuniService.getPage(options);
}

export async function finishAdminPenghuni(
  idSewa: number,
): Promise<string | undefined> {
  return penghuniService.finish(idSewa);
}
