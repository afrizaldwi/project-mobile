import { apiClient } from "@/api/client";
import type {
    AdminDashboardResponse,
    PenyewaDashboardResponse,
} from "@/types/dashboard";

export async function getAdminDashboardSummary(): Promise<AdminDashboardResponse> {
    const response = await apiClient.get<AdminDashboardResponse>(
        "/admin/dashboard-summary"
    );

    return response.data;
}

export async function getPenyewaDashboardSummary(): Promise<PenyewaDashboardResponse> {
    const response = await apiClient.get<PenyewaDashboardResponse>(
        "/penyewa/dashboard-summary"
    );

    return response.data;
}
