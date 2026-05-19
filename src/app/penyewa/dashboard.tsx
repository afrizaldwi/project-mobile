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

import { getPenyewaDashboardSummary } from "@/api/dashboard";
import { useAuth } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { PenyewaDashboardSummary } from "@/types";

const formatRupiah = (value: number | null) => {
    if (value === null || value === undefined) return "-";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatStatus = (value?: string | null) => {
    if (!value) return "-";

    return value.replace(/_/g, " ").toUpperCase();
};

export default function PenyewaDashboardScreen() {
    return (
        <ProtectedRoute allowedRoles={["penyewa"]}>
            <PenyewaDashboardContent />
        </ProtectedRoute>
    );
}

function PenyewaDashboardContent() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [summary, setSummary] = useState<PenyewaDashboardSummary | null>(null);
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

            const data = await getPenyewaDashboardSummary();
            setSummary(data);
        } catch (error) {
            console.log("PENYEWA DASHBOARD ERROR:", error);
            setErrorMessage("Gagal memuat dashboard penyewa.");
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
                label: "Kamar Saya",
                value: summary.cards.kamar_saya || "-",
                description: "Nomor kamar aktif",
            },
            {
                label: "Tagihan Aktif",
                value: String(summary.cards.tagihan_aktif ?? 0),
                description: "Belum bayar / telat",
            },
            {
                label: "Status Pembayaran",
                value: formatStatus(summary.cards.status_pembayaran),
                description: "Status tagihan terbaru",
            },
            {
                label: "Sisa Sewa",
                value: summary.cards.sisa_masa_sewa || "-",
                description: "Estimasi masa sewa",
            },
            {
                label: "Keluhan Saya",
                value: String(summary.cards.keluhan_saya ?? 0),
                description: "Total laporan kerusakan",
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
                    Dashboard
                </Text>
                <Text className="mt-2 text-2xl font-black text-white">
                    Halo, {user?.nama_lengkap || "Penyewa"}
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
                        <Text className="mt-2 text-xl font-bold text-dark">
                            {card.value}
                        </Text>
                        <Text className="mt-1 text-xs font-medium text-dark/40">
                            {card.description}
                        </Text>
                    </View>
                ))}
            </View>

            {summary?.kamar ? (
                <Section title="Informasi Kamar">
                    <InfoRow label="Nomor Kamar" value={summary.kamar.nomor_kamar || "-"} />
                    <InfoRow label="Fasilitas" value={summary.kamar.fasilitas || "-"} />
                    <InfoRow
                        label="Harga Bulanan"
                        value={formatRupiah(summary.kamar.harga_bulanan)}
                    />
                    <InfoRow label="Status" value={formatStatus(summary.kamar.status_kamar)} />
                </Section>
            ) : (
                <Section title="Informasi Kamar">
                    <Text className="text-sm font-medium text-dark/40">
                        Belum ada sewa aktif.
                    </Text>
                </Section>
            )}

            {summary?.tagihan_terbaru ? (
                <Section title="Tagihan Terbaru">
                    <InfoRow
                        label="Kode Invoice"
                        value={summary.tagihan_terbaru.kode_invoice || "-"}
                    />
                    <InfoRow
                        label="Jatuh Tempo"
                        value={summary.tagihan_terbaru.tanggal_jatuh_tempo || "-"}
                    />
                    <InfoRow
                        label="Total Tagihan"
                        value={formatRupiah(summary.tagihan_terbaru.total_tagihan)}
                    />
                    <InfoRow
                        label="Status"
                        value={formatStatus(summary.tagihan_terbaru.status_tagihan)}
                    />
                </Section>
            ) : null}

            {summary?.kontrak ? (
                <Section title="Masa Sewa">
                    <InfoRow label="Tanggal Masuk" value={summary.kontrak.tanggal_masuk} />
                    <InfoRow
                        label="Tanggal Keluar"
                        value={summary.kontrak.tanggal_keluar || "-"}
                    />
                    <InfoRow
                        label="Durasi"
                        value={`${summary.kontrak.durasi_sewa_bulan} bulan`}
                    />
                    <InfoRow label="Sisa Masa Sewa" value={summary.kontrak.sisa_masa_sewa} />

                    <View className="mt-4">
                        <View className="h-3 overflow-hidden rounded-full bg-light">
                            <View
                                className="h-3 rounded-full bg-primary"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(0, summary.kontrak.progress_persen)
                                    )}%`,
                                }}
                            />
                        </View>
                        <Text className="mt-2 text-xs font-bold text-dark/40">
                            Progress {summary.kontrak.progress_persen}%
                        </Text>
                    </View>
                </Section>
            ) : null}

            <Section title="Keluhan Terakhir">
                {!summary || summary.keluhan_terakhir.length === 0 ? (
                    <Text className="text-sm font-medium text-dark/40">
                        Belum ada keluhan terakhir.
                    </Text>
                ) : (
                    summary.keluhan_terakhir.map((item, index) => (
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

type InfoRowProps = {
    label: string;
    value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <View className="mb-3 rounded-2xl bg-light px-4 py-3">
            <Text className="text-xs font-bold uppercase text-dark/40">{label}</Text>
            <Text className="mt-1 font-bold text-dark">{value}</Text>
        </View>
    );
}