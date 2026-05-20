import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { router } from "expo-router";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
    deleteKamar,
    formatHarga,
    formatTanggal,
    getAllKamar,
    getImageUrl,
    getStatusBadge,
} from "@/api/kamarService";
import type { Kamar, KamarListResponse, KamarPayload, KamarStatus } from "@/types/kamar";

type ViewStrategy = "grid" | "list";
type FilterStatus = "semua" | KamarStatus;

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
    { label: "Semua Status", value: "semua" },
    { label: "Tersedia", value: "tersedia" },
    { label: "Terisi", value: "terisi" },
];

function StatusBadge({ status }: { status: Kamar["status_kamar"] }) {
    const badge = getStatusBadge(status);
    return (
        <View
            style={{ backgroundColor: badge.bgColor }}
            className="rounded-full px-2 py-0.5"
        >
            <Text style={{ color: badge.textColor }} className="text-[10px] font-bold">
                {badge.label}
            </Text>
        </View>
    );
}

function StatusDropdown({
    selected,
    onSelect,
}: {
    selected: FilterStatus;
    onSelect: (val: FilterStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedLabel =
        FILTER_OPTIONS.find((o) => o.value === selected)?.label ?? "Semua Status";

    return (
        <View style={{ position: "relative", zIndex: 10 }}>
            <Pressable
                onPress={() => setOpen((v) => !v)}
                className="flex-row items-center gap-1 rounded-xl bg-white px-3 active:opacity-80"
                style={{ elevation: 1, height: 44 }}
            >
                <Text className="text-xs font-semibold text-dark">{selectedLabel}</Text>
                <Text className="text-[10px] text-gray-400">{open ? "▲" : "▼"}</Text>
            </Pressable>

            {open && (
                <View
                    className="absolute right-0 top-12 overflow-hidden rounded-xl bg-white"
                    style={{ elevation: 10, minWidth: 130, zIndex: 999 }}
                >
                    {FILTER_OPTIONS.map((opt, i) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => {
                                onSelect(opt.value);
                                setOpen(false);
                            }}
                            className={`px-4 py-2.5 active:opacity-70 ${
                                selected === opt.value ? "bg-secondary" : "bg-white"
                            } ${i !== FILTER_OPTIONS.length - 1 ? "border-b border-gray-100" : ""}`}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    selected === opt.value ? "text-primary" : "text-dark"
                                }`}
                            >
                                {opt.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

function KamarGridCard({
    kamar,
    onEdit,
    onHapus,
}: {
    kamar: Kamar;
    onEdit: () => void;
    onHapus: () => void;
}) {
    const fasilitasList = kamar.fasilitas.split(",").map((f) => f.trim());
    const fotoUri = getImageUrl(kamar.foto_kamar);
    const [imageError, setImageError] = useState(false);

    return (
        <View
            className="mb-3 overflow-hidden rounded-2xl bg-white"
            style={{
                width: "48%",
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 6,
            }}
        >
            {fotoUri && !imageError ? (
                <Image
                    source={{ uri: fotoUri }}
                    className="h-24 w-full"
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <View className="h-24 w-full items-center justify-center bg-blue-50">
                    <Text className="text-4xl">🛏️</Text>
                </View>
            )}

            <View className="absolute right-2 top-2">
                <StatusBadge status={kamar.status_kamar} />
            </View>

            <View className="p-2.5">
                <Text className="text-sm font-bold text-dark">No. {kamar.nomor_kamar}</Text>
                <Text className="text-xs font-semibold text-primary">
                    {formatHarga(kamar.harga_bulanan)}/bln
                </Text>
                <Text className="mt-0.5 text-[10px] text-gray-500">📐 {kamar.luas_kamar}</Text>

                <View className="mt-1.5 flex-row flex-wrap gap-1">
                    {fasilitasList.slice(0, 3).map((f, i) => (
                        <View key={i} className="rounded-full bg-blue-50 px-1.5 py-0.5">
                            <Text className="text-[9px] font-medium text-primary">{f}</Text>
                        </View>
                    ))}
                    {fasilitasList.length > 3 && (
                        <Text className="text-[9px] text-gray-400">
                            +{fasilitasList.length - 3} lainnya
                        </Text>
                    )}
                </View>

                <Text className="mt-1.5 text-[9px] text-gray-400">
                    {formatTanggal(kamar.created_at)}
                </Text>

                <View className="mt-2 flex-row gap-1.5">
                    <Pressable
                        onPress={onEdit}
                        className="flex-1 items-center rounded-lg bg-blue-50 py-1.5 active:opacity-70"
                    >
                        <Text className="text-[11px] font-semibold text-primary">✏️ Edit</Text>
                    </Pressable>
                    <Pressable
                        onPress={onHapus}
                        className="flex-1 items-center rounded-lg bg-red-50 py-1.5 active:opacity-70"
                    >
                        <Text className="text-[11px] font-semibold text-red-600">🗑️ Hapus</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

function KamarListCard({
    kamar,
    onEdit,
    onHapus,
}: {
    kamar: Kamar;
    onEdit: () => void;
    onHapus: () => void;
}) {
    return (
        <View
            className="mb-3 overflow-hidden rounded-2xl bg-white"
            style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 }}
        >
            <View className="flex-row items-start justify-between p-3">
                <View className="flex-1">
                    <Text className="text-sm font-bold text-dark">No. {kamar.nomor_kamar}</Text>
                    <Text className="text-[10px] text-gray-500">📐 {kamar.luas_kamar}</Text>
                </View>
                <View className="items-end gap-1.5">
                    <Text className="text-xs font-semibold text-primary">
                        {formatHarga(kamar.harga_bulanan)}
                    </Text>
                    <StatusBadge status={kamar.status_kamar} />
                </View>
            </View>

            <View className="border-t border-gray-100 px-3 pb-2 pt-1.5">
                <Text className="text-[10px] text-gray-500" numberOfLines={2}>
                    {kamar.fasilitas}
                </Text>
                <Text className="mt-1 text-[9px] text-gray-400">
                    Ditambahkan: {formatTanggal(kamar.created_at)}
                </Text>
                <Text className="text-[9px] text-gray-400">
                    Terakhir diedit: {formatTanggal(kamar.updated_at)}
                </Text>
            </View>

            <View className="flex-row gap-2 border-t border-gray-100 px-3 py-2">
                <Pressable
                    onPress={onEdit}
                    className="flex-1 items-center rounded-xl bg-blue-50 py-2 active:opacity-70"
                >
                    <Text className="text-xs font-semibold text-primary">✏️ Edit</Text>
                </Pressable>
                <Pressable
                    onPress={onHapus}
                    className="flex-1 items-center rounded-xl bg-red-50 py-2 active:opacity-70"
                >
                    <Text className="text-xs font-semibold text-red-600">🗑️ Hapus</Text>
                </Pressable>
            </View>
        </View>
    );
}

export default function AdminKamarScreen() {
    const [kamarData, setKamarData] = useState<KamarListResponse | null>(null);
    const [kamarList, setKamarList] = useState<Kamar[]>([]);
    const [filtered, setFiltered] = useState<Kamar[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
    const [viewStrategy, setViewStrategy] = useState<ViewStrategy>("grid");
    const [hapusModal, setHapusModal] = useState<{ visible: boolean; kamar: Kamar | null }>({
        visible: false,
        kamar: null,
    });
    const [hapusLoading, setHapusLoading] = useState(false);

    const stats = {
        total: kamarData?.total ?? 0,
        tersedia: kamarData?.tersedia ?? 0,
        terisi: kamarData?.terisi ?? 0,
    };

    const fetchKamar = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllKamar();
            setKamarData(data);
            setKamarList(data.data);
            setFiltered(data.data);
        } catch {
            Alert.alert("Error", "Gagal memuat data kamar.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKamar();
    }, [fetchKamar]);

    useEffect(() => {
        let result = kamarList;
        if (filterStatus !== "semua") {
            result = result.filter((k) => k.status_kamar === filterStatus);
        }
        if (search.trim()) {
            result = result.filter((k) =>
                k.nomor_kamar.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFiltered(result);
    }, [search, filterStatus, kamarList]);

    const handleHapus = async () => {
        if (!hapusModal.kamar) return;
        try {
            setHapusLoading(true);
            await deleteKamar(hapusModal.kamar.id_kamar);
            setHapusModal({ visible: false, kamar: null });
            await fetchKamar();
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? "Gagal menghapus kamar.";
            Alert.alert("Gagal Menghapus", msg);
        } finally {
            setHapusLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <View className="flex-1 bg-secondary">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="mb-3 flex-row items-start justify-between">
                        <View className="flex-1">
                            <Text className="text-2xl font-extrabold text-dark">Data Kamar</Text>
                            <Text className="text-xs text-gray-500">
                                Kelola data kamar Kost Bahagia
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => router.push("/admin/kamar-tambah")}
                            className="rounded-xl bg-primary px-4 py-2.5 active:opacity-80"
                        >
                            <Text className="text-sm font-bold text-white">+ Tambah</Text>
                        </Pressable>
                    </View>

                    <View className="mb-3 flex-row gap-2">
                        {[
                            { label: "Total", value: stats.total, color: "text-dark" },
                            { label: "Tersedia", value: stats.tersedia, color: "text-green-600" },
                            { label: "Terisi", value: stats.terisi, color: "text-red-600" },
                        ].map((s) => (
                            <View
                                key={s.label}
                                className="flex-1 rounded-xl bg-white p-3"
                                style={{ elevation: 1 }}
                            >
                                <Text className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                                    {s.label}
                                </Text>
                                <Text className={`text-2xl font-extrabold ${s.color}`}>
                                    {s.value}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View className="mb-4 flex-row items-center gap-2">
                        <View
                            className="flex-1 flex-row items-center rounded-xl bg-white px-3"
                            style={{ elevation: 1, height: 44 }}
                        >
                            <Text className="mr-2 text-gray-400">🔍</Text>
                            <TextInput
                                placeholder="Cari nomor kamar..."
                                placeholderTextColor="#9ca3af"
                                value={search}
                                onChangeText={setSearch}
                                className="flex-1 text-sm text-dark"
                                style={{ height: 44 }}
                            />
                        </View>

                        <StatusDropdown selected={filterStatus} onSelect={setFilterStatus} />

                        <View
                            className="flex-row rounded-xl bg-white p-1"
                            style={{ elevation: 1, height: 44, alignItems: "center" }}
                        >
                            <Pressable
                                onPress={() => setViewStrategy("grid")}
                                className={`rounded-lg px-2.5 py-1.5 ${viewStrategy === "grid" ? "bg-primary" : ""}`}
                            >
                                <Text className={`text-sm ${viewStrategy === "grid" ? "text-white" : "text-gray-400"}`}>
                                    ⊞
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setViewStrategy("list")}
                                className={`rounded-lg px-2.5 py-1.5 ${viewStrategy === "list" ? "bg-primary" : ""}`}
                            >
                                <Text className={`text-sm ${viewStrategy === "list" ? "text-white" : "text-gray-400"}`}>
                                    ☰
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {loading && (
                        <View className="items-center py-16">
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text className="mt-3 text-sm text-gray-400">Memuat data kamar...</Text>
                        </View>
                    )}

                    {!loading && filtered.length === 0 && (
                        <View className="items-center py-16">
                            <Text className="text-4xl">🛏️</Text>
                            <Text className="mt-3 text-sm font-semibold text-gray-500">
                                Belum ada data kamar
                            </Text>
                            <Text className="mt-1 text-xs text-gray-400">
                                {filterStatus !== "semua"
                                    ? `Tidak ada kamar dengan status "${filterStatus}"`
                                    : `Tap "+ Tambah" untuk menambah kamar baru`}
                            </Text>
                        </View>
                    )}

                    {!loading && filtered.length > 0 && viewStrategy === "grid" && (
                        <View className="flex-row flex-wrap justify-between gap-y-0">
                            {filtered.map((kamar) => (
                                <KamarGridCard
                                    key={kamar.id_kamar}
                                    kamar={kamar}
                                    onEdit={() =>
                                        router.push({
                                            pathname: "/admin/kamar-edit",
                                            params: { id: kamar.id_kamar },
                                        })
                                    }
                                    onHapus={() => setHapusModal({ visible: true, kamar })}
                                />
                            ))}
                        </View>
                    )}

                    {!loading && filtered.length > 0 && viewStrategy === "list" && (
                        <View>
                            {filtered.map((kamar) => (
                                <KamarListCard
                                    key={kamar.id_kamar}
                                    kamar={kamar}
                                    onEdit={() =>
                                        router.push({
                                            pathname: "/admin/kamar-edit",
                                            params: { id: kamar.id_kamar },
                                        })
                                    }
                                    onHapus={() => setHapusModal({ visible: true, kamar })}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>

                <Modal
                    visible={hapusModal.visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setHapusModal({ visible: false, kamar: null })}
                >
                    <View className="flex-1 items-center justify-center bg-black/50 px-6">
                        <View className="w-full rounded-2xl bg-white p-6" style={{ elevation: 10 }}>
                            <View className="mb-3 flex-row items-center gap-3">
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                                    <Text className="text-lg">🗑️</Text>
                                </View>
                                <View>
                                    <Text className="text-base font-bold text-dark">
                                        Hapus kamar ini?
                                    </Text>
                                    <Text className="text-xs text-gray-500">
                                        No. {hapusModal.kamar?.nomor_kamar}
                                    </Text>
                                </View>
                            </View>
                            <Text className="mb-5 text-sm leading-5 text-gray-600">
                                Data kamar yang dihapus tidak dapat dikembalikan. Pastikan kamar ini
                                tidak sedang dihuni sebelum menghapus.
                            </Text>
                            <View className="flex-row gap-3">
                                <Pressable
                                    onPress={() => setHapusModal({ visible: false, kamar: null })}
                                    className="flex-1 items-center rounded-xl border border-gray-200 py-3 active:opacity-70"
                                >
                                    <Text className="text-sm font-semibold text-gray-700">Batal</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleHapus}
                                    disabled={hapusLoading}
                                    className="flex-1 items-center rounded-xl bg-red-600 py-3 active:opacity-70"
                                >
                                    {hapusLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="text-sm font-semibold text-white">
                                            Ya, hapus
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </ProtectedRoute>
    );
}