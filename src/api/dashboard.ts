import { apiClient } from "@/api/client";
import type { AdminDashboardSummary, PenyewaDashboardSummary } from "@/types";

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const response = await apiClient.get<AdminDashboardSummary>(
        "/admin/dashboard-summary"
    );

    return response.data;
}

export async function getPenyewaDashboardSummary(): Promise<PenyewaDashboardSummary> {
    const response = await apiClient.get<PenyewaDashboardSummary>(
        "/penyewa/dashboard-summary"
    );

    return response.data;
}