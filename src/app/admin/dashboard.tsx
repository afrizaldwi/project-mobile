import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { syncAdminDashboard } from "@/database/dashboardSync";
import { useDashboardSnapshot } from "@/hooks/useDashboardSnapshot";
import type { AdminDashboardSummary } from "@/types/dashboard";
import { useSQLiteContext } from "expo-sqlite";
import { DashboardLoading } from "@/components/dashboard/DashboardLoading";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMessage } from "@/components/dashboard/DashboardMessage";
import { DashboardSummaryGrid } from "@/components/dashboard/DashboardSummaryGrid";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { RecentComplaintList } from "@/components/dashboard/RecentComplaintList";

const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value || 0);
};

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value || 0);
};

export default function AdminDashboardScreen() {
    return (
        <AdminDashboardContent />
    );
}

function AdminDashboardContent() {
    const router = useRouter();
    const db = useSQLiteContext();
    const { user, logout } = useAuth();
    const sync = useCallback(
        (force = false) => syncAdminDashboard(db, force),
        [db],
    );
    const {
        summary,
        isLoading,
        isRefreshing,
        error: errorMessage,
        notice,
        refresh,
    } = useDashboardSnapshot<AdminDashboardSummary>("admin", sync);

    const cards = useMemo(() => {
        if (!summary) return [];

        return [
            {
                label: "Total Kamar",
                value: formatNumber(summary.cards.total_kamar),
                description: "Seluruh kamar kost",
            },
            {
                label: "Penghuni Aktif",
                value: formatNumber(summary.cards.penghuni_aktif),
                description: "Sewa aktif saat ini",
            },
            {
                label: "Tagihan Belum Bayar",
                value: formatNumber(summary.cards.tagihan_belum_dibayar),
                description: "Belum bayar atau telat",
            },
            {
                label: "Pendapatan Bulan Ini",
                value: formatRupiah(summary.cards.pendapatan_bulan_ini),
                description: "Pembayaran diterima",
            },
            {
                label: "Keluhan Pending",
                value: formatNumber(summary.cards.keluhan_pending),
                description: "Menunggu diproses",
            },
        ];
    }, [summary]);

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    if (isLoading && !summary) {
        return <DashboardLoading />;
    }

    return (
        <ScrollView
            className="flex-1 bg-light"
            contentContainerClassName="p-4 pb-10"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={refresh}
                />
            }
        >
            <DashboardHeader
                title="Admin Dashboard"
                userName={user?.nama_lengkap}
                fallbackName="Admin"
                onLogout={handleLogout}
            />

            {errorMessage ? (
                <DashboardMessage
                    variant="error"
                    message={errorMessage}
                />
            ) : null}
            {notice ? (
                <DashboardMessage
                    variant="notice"
                    message={notice}
                />
            ) : null}

            <DashboardSummaryGrid
                cards={cards}
                valueWeight="black"
            />

            {summary ? (
                <>
                    <DashboardSection title="Status Kamar">
                        <MiniBarChart
                            items={[
                                {
                                    label: "Tersedia",
                                    value: summary.charts.status_kamar.tersedia,
                                },
                                {
                                    label: "Terisi",
                                    value: summary.charts.status_kamar.terisi,
                                },
                                {
                                    label: "Perbaikan",
                                    value: summary.charts.status_kamar.perbaikan,
                                },
                            ]}
                        />
                    </DashboardSection>

                    <DashboardSection title="Status Tagihan">
                        <MiniBarChart
                            items={[
                                {
                                    label: "Belum Bayar",
                                    value: summary.charts.status_tagihan.belum_bayar,
                                },
                                {
                                    label: "Lunas",
                                    value: summary.charts.status_tagihan.lunas,
                                },
                                {
                                    label: "Telat",
                                    value: summary.charts.status_tagihan.telat,
                                },
                            ]}
                        />
                    </DashboardSection>

                    <DashboardSection title="Status Keluhan">
                        <MiniBarChart
                            items={[
                                {
                                    label: "Pending",
                                    value: summary.charts.status_keluhan.pending,
                                },
                                {
                                    label: "Proses",
                                    value: summary.charts.status_keluhan.proses,
                                },
                                {
                                    label: "Selesai",
                                    value: summary.charts.status_keluhan.selesai,
                                },
                            ]}
                        />
                    </DashboardSection>

                    <DashboardSection title="Keluhan Terbaru">
                        <RecentComplaintList
                            items={summary.recent_keluhan}
                            emptyMessage="Belum ada keluhan terbaru."
                        />
                    </DashboardSection>
                </>
            ) : null}
        </ScrollView>
    );
}
type ChartItem = {
    label: string;
    value: number;
};

type MiniBarChartProps = {
    items: ChartItem[];
};

function MiniBarChart({ items }: MiniBarChartProps) {
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <View className="space-y-4">
            <View className="rounded-2xl bg-light p-4">
                <Text className="text-xs font-bold uppercase text-dark/40">
                    Total Data
                </Text>
                <Text className="mt-1 text-2xl font-black text-dark">
                    {formatNumber(total)}
                </Text>
            </View>

            {items.map((item) => {
                const percentage = Math.round((item.value / maxValue) * 100);

                return (
                    <View key={item.label}>
                        <View className="mb-2 flex-row items-center justify-between">
                            <Text className="text-sm font-bold text-dark/70">
                                {item.label}
                            </Text>
                            <Text className="text-sm font-black text-dark">
                                {formatNumber(item.value)}
                            </Text>
                        </View>

                        <View className="h-3 overflow-hidden rounded-full bg-light">
                            <View
                                className="h-3 rounded-full bg-primary"
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
