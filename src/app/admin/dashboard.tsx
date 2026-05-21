import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

import { getAdminDashboardSummary } from "@/api/dashboard";
import { useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { AdminDashboardSummary } from "@/types";

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
        <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}

function AdminDashboardContent() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchSummary = async (refresh = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            setErrorMessage("");

            const data = await getAdminDashboardSummary();
            setSummary(data);
        } catch (error) {
            console.log("ADMIN DASHBOARD ERROR:", error);
            setErrorMessage("Gagal memuat dashboard admin.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

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

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-light">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-3 text-sm font-semibold text-dark/50">
                    Memuat dashboard...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-light"
            contentContainerClassName="p-4 pb-10"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => fetchSummary(true)}
                />
            }
        >
            <View className="mb-5 rounded-3xl bg-primary p-5">
                <Text className="text-xs font-bold uppercase tracking-widest text-white/70">
                    Admin Dashboard
                </Text>
                <Text className="mt-2 text-2xl font-black text-white">
                    Halo, {user?.nama_lengkap || "Admin"}
                </Text>
                <Pressable
                    onPress={handleLogout}
                    className="mt-4 self-start rounded-xl bg-white/15 px-4 py-2"
                >
                    <Text className="text-sm font-bold text-white">Logout</Text>
                </Pressable>
            </View>

            {errorMessage ? (
                <View className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 p-4">
                    <Text className="text-sm font-bold text-danger">{errorMessage}</Text>
                </View>
            ) : null}

            <View className="flex-row flex-wrap gap-3">
                {cards.map((card) => (
                    <View
                        key={card.label}
                        className="min-h-[118px] flex-1 basis-[47%] rounded-2xl border border-gray-100 bg-white p-4"
                    >
                        <Text className="text-xs font-bold uppercase text-dark/40">
                            {card.label}
                        </Text>
                        <Text className="mt-2 text-xl font-black text-dark">
                            {card.value}
                        </Text>
                        <Text className="mt-1 text-xs font-medium text-dark/40">
                            {card.description}
                        </Text>
                    </View>
                ))}
            </View>

            {summary ? (
                <>
                    <Section title="Status Kamar">
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
                    </Section>

                    <Section title="Status Tagihan">
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
                    </Section>

                    <Section title="Status Keluhan">
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
                    </Section>

                    <Section title="Keluhan Terbaru">
                        {summary.recent_keluhan.length === 0 ? (
                            <Text className="text-sm font-medium text-dark/40">
                                Belum ada keluhan terbaru.
                            </Text>
                        ) : (
                            summary.recent_keluhan.map((item, index) => (
                                <View
                                    key={`${item.judul}-${index}`}
                                    className="mb-3 rounded-2xl bg-light p-4"
                                >
                                    <Text className="font-black text-dark">{item.judul}</Text>
                                    <Text className="mt-1 text-xs font-semibold uppercase text-primary">
                                        {item.status}
                                    </Text>
                                    <Text className="mt-1 text-xs font-medium text-dark/40">
                                        {item.tanggal}
                                    </Text>
                                </View>
                            ))
                        )}
                    </Section>
                </>
            ) : null}
        </ScrollView>
    );
}

type SectionProps = {
    title: string;
    children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
    return (
        <View className="mt-5 rounded-3xl border border-gray-100 bg-white p-5">
            <Text className="mb-4 text-lg font-black text-dark">{title}</Text>
            {children}
        </View>
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