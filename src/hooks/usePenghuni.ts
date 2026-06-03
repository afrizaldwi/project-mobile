import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { apiClient } from "@/api/client";

export type StatusPenghuni = "AKTIF" | "NON AKTIF";

export interface Penghuni {
    id: string;
    nama: string;
    email: string;
    kamar: string;
    ukuranKamar: string;
    tglMasuk: string;
    tglKeluar: string;
    status: StatusPenghuni;
    hargaBulanan: number;
}

interface UserResponse {
    id: number;
    nama_lengkap: string;
    email: string;
    no_hp: string;
    foto_profil: string | null;
    alamat_asal?: string | null;
}

interface KamarResponse {
    id_kamar: number;
    nomor_kamar: string;
    harga_bulanan: number;
    fasilitas: string | null;
}

interface RiwayatSewaResponse {
    id_sewa: number;
    tanggal_masuk: string;
    tanggal_keluar: string | null;
    status_sewa: "aktif" | "selesai" | "dibatalkan";
    user?: UserResponse;
    kamar?: KamarResponse;
}

const mockData: Penghuni[] = [
    {
        id: "1",
        nama: "Budi Santoso",
        email: "budi@kost.com",
        kamar: "A-01",
        ukuranKamar: "3x3 m",
        tglMasuk: "2026-04-01",
        tglKeluar: "-",
        status: "AKTIF",
        hargaBulanan: 0,
    },
    {
        id: "2",
        nama: "Siti Aminah",
        email: "siti@kost.com",
        kamar: "A-02",
        ukuranKamar: "3x3 m",
        tglMasuk: "2026-03-01",
        tglKeluar: "-",
        status: "AKTIF",
        hargaBulanan: 0,
    },
    {
        id: "3",
        nama: "Andi Pratama",
        email: "andi@kost.com",
        kamar: "B-01",
        ukuranKamar: "4x3 m",
        tglMasuk: "2026-02-01",
        tglKeluar: "-",
        status: "AKTIF",
        hargaBulanan: 0,
    },
    {
        id: "4",
        nama: "Rina Lestari",
        email: "rina@kost.com",
        kamar: "B-02",
        ukuranKamar: "4x3 m",
        tglMasuk: "2025-09-01",
        tglKeluar: "2026-03-31",
        status: "NON AKTIF",
        hargaBulanan: 0,
    },
];

const mapResponseToPenghuni = (sewa: RiwayatSewaResponse): Penghuni => {
    return {
        id: sewa.id_sewa.toString(),
        nama: sewa.user?.nama_lengkap || "—",
        email: sewa.user?.email || "—",
        kamar: sewa.kamar?.nomor_kamar || "—",
        ukuranKamar: sewa.kamar?.fasilitas || "3x3 m",
        tglMasuk: sewa.tanggal_masuk,
        tglKeluar: sewa.tanggal_keluar || "—",
        status: sewa.status_sewa === "aktif" ? "AKTIF" : "NON AKTIF",
        hargaBulanan: Number(sewa.kamar?.harga_bulanan || 0),
    };
};

export function usePenghuni() {
    const [activeTab, setActiveTab] = useState<"AKTIF" | "NON AKTIF">("AKTIF");
    const [searchQuery, setSearchQuery] = useState("");
    const [data, setData] = useState<Penghuni[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Maps to Laravel backend endpoint prefix /admin/penghuni
            // status parameter accepts 'aktif' or 'selesai'
            const statusParam = activeTab === "AKTIF" ? "aktif" : "selesai";
            const res = await apiClient.get<{ data: RiwayatSewaResponse[] }>("/admin/penghuni", {
                params: { status: statusParam }
            });

            if (res.data && Array.isArray(res.data.data)) {
                let mappedData = res.data.data.map(mapResponseToPenghuni);

                // Client-side search filtering
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    mappedData = mappedData.filter(item =>
                        item.nama.toLowerCase().includes(q) ||
                        item.kamar.toLowerCase().includes(q) ||
                        item.email.toLowerCase().includes(q)
                    );
                }

                setData(mappedData);
            } else {
                throw new Error("Format respons tidak valid");
            }
        } catch (err: any) {
            console.log("Error fetching data, using fallback mock data:", err?.message || err);
            // Fallback to local mock data
            const filteredMock = mockData.filter((item) => {
                const matchesTab = item.status === activeTab;
                const matchesSearch =
                    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.kamar.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesTab && matchesSearch;
            });
            setData(filteredMock);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, searchQuery]);

    const handleArchive = async (idSewa: string) => {
        Alert.alert(
            "Konfirmasi",
            "Apakah Anda yakin ingin mengarsipkan penghuni ini sebagai alumni?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Arsipkan",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const res = await apiClient.patch<{ message: string }>(`/admin/penghuni/${idSewa}/selesaikan`);
                            Alert.alert("Sukses", res.data.message || "Penghuni berhasil diarsipkan.");
                            fetchData();
                        } catch (err: any) {
                            console.log("Error archiving tenant:", err?.response?.data || err);
                            const msg = err?.response?.data?.message || "Gagal mengarsipkan penghuni.";
                            Alert.alert("Gagal", msg);
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        filteredData: data,
        isLoading,
        error,
        refetch: fetchData,
        handleArchive,
    };
}
