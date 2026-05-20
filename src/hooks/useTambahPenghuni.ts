import { useState, useMemo, useEffect } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { apiClient } from "@/api/client";

type TipeKamar = "A" | "B" | "C";

interface RoomOption {
    id: string;
    nomor: string;
    isTersedia: boolean;
}

interface KamarTersedia {
    id_kamar: number;
    nomor_kamar: string;
    harga_bulanan: number;
    fasilitas: string | null;
}

const DEFAULT_MOCK_ROOMS: Record<TipeKamar, { harga: number; fasilitas: string; kamar: RoomOption[] }> = {
    A: {
        harga: 800000,
        fasilitas: "Kasur, Lemari, Meja, WiFi",
        kamar: Array.from({ length: 5 }, (_, i) => ({
            id: `mock-A-0${i + 1}`,
            nomor: `A-0${i + 1} (Mock)`,
            isTersedia: true,
        })),
    },
    B: {
        harga: 1000000,
        fasilitas: "Kasur, Lemari, Meja, WiFi, Kamar mandi dalam",
        kamar: Array.from({ length: 5 }, (_, i) => ({
            id: `mock-B-0${i + 1}`,
            nomor: `B-0${i + 1} (Mock)`,
            isTersedia: true,
        })),
    },
    C: {
        harga: 1250000,
        fasilitas: "Kasur, Lemari, Meja, WiFi, Kamar mandi dalam, AC",
        kamar: Array.from({ length: 5 }, (_, i) => ({
            id: `mock-C-0${i + 1}`,
            nomor: `C-0${i + 1} (Mock)`,
            isTersedia: true,
        })),
    },
};

export function useTambahPenghuni() {
    const router = useRouter();

    // Data Penghuni Form State
    const [nama, setNama] = useState("");
    const [noHp, setNoHp] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [alamatAsal, setAlamatAsal] = useState("");

    // Data Sewa Form State
    const [tipeKamar, setTipeKamar] = useState<TipeKamar | null>(null);
    const [kamar, setKamar] = useState<string>("");
    const [tglMasuk, setTglMasuk] = useState(() => {
        const today = new Date();
        return `${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getDate().toString().padStart(2, "0")}/${today.getFullYear()}`;
    });
    const [durasiBulan, setDurasiBulan] = useState("1");
    
    // API loading state
    const [availableRooms, setAvailableRooms] = useState<KamarTersedia[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch available rooms from Laravel server
    useEffect(() => {
        async function fetchAvailableRooms() {
            try {
                setIsLoadingRooms(true);
                const res = await apiClient.get<{ data: KamarTersedia[] }>("/admin/kamar/tersedia");
                if (res.data && Array.isArray(res.data.data)) {
                    setAvailableRooms(res.data.data);
                }
            } catch (err) {
                console.log("Error loading available rooms, using defaults:", err);
            } finally {
                setIsLoadingRooms(false);
            }
        }
        fetchAvailableRooms();
    }, []);

    // Combine real database rooms and defaults dynamically
    const roomData = useMemo(() => {
        const data = {
            A: { harga: 800000, fasilitas: "Kasur, Lemari, Meja, WiFi", kamar: [] as RoomOption[] },
            B: { harga: 1000000, fasilitas: "Kasur, Lemari, Meja, WiFi, Kamar mandi dalam", kamar: [] as RoomOption[] },
            C: { harga: 1250000, fasilitas: "Kasur, Lemari, Meja, WiFi, Kamar mandi dalam, AC", kamar: [] as RoomOption[] },
        };

        // Group real rooms by category prefix
        availableRooms.forEach(room => {
            const firstChar = room.nomor_kamar.charAt(0).toUpperCase();
            if (firstChar === "A" || firstChar === "B" || firstChar === "C") {
                const key = firstChar as TipeKamar;
                data[key].harga = room.harga_bulanan;
                if (room.fasilitas) {
                    data[key].fasilitas = room.fasilitas;
                }
                data[key].kamar.push({
                    id: room.id_kamar.toString(),
                    nomor: room.nomor_kamar,
                    isTersedia: true
                });
            }
        });

        // Fallback to default mock rooms if a category has no rooms in the database
        (["A", "B", "C"] as const).forEach(key => {
            if (data[key].kamar.length === 0) {
                data[key].kamar = DEFAULT_MOCK_ROOMS[key].kamar;
                data[key].harga = DEFAULT_MOCK_ROOMS[key].harga;
                data[key].fasilitas = DEFAULT_MOCK_ROOMS[key].fasilitas;
            }
        });

        return data;
    }, [availableRooms]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const totalTagihan = useMemo(() => {
        if (!tipeKamar) return 0;
        const hargaPerBulan = roomData[tipeKamar].harga;
        const durasi = parseInt(durasiBulan) || 0;
        return hargaPerBulan * durasi;
    }, [tipeKamar, durasiBulan, roomData]);

    const estimasiCheckOut = useMemo(() => {
        if (!tglMasuk) return "-";
        try {
            // Support both YYYY-MM-DD and MM/DD/YYYY parsing
            let date: Date;
            if (tglMasuk.includes("/")) {
                const [month, day, year] = tglMasuk.split("/");
                date = new Date(Number(year), Number(month) - 1, Number(day));
            } else if (tglMasuk.includes("-")) {
                const [year, month, day] = tglMasuk.split("-");
                date = new Date(Number(year), Number(month) - 1, Number(day));
            } else {
                date = new Date(tglMasuk);
            }

            if (isNaN(date.getTime())) return "-";

            const durasi = parseInt(durasiBulan) || 0;
            date.setMonth(date.getMonth() + durasi);

            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch {
            return "-";
        }
    }, [tglMasuk, durasiBulan]);

    const handleSave = async () => {
        if (!nama.trim() || !noHp.trim() || !email.trim() || !password.trim() || !kamar || !tglMasuk || !durasiBulan) {
            Alert.alert("Error", "Semua kolom bertanda * wajib diisi.");
            return;
        }

        setIsSaving(true);
        try {
            // If it's a mock room ID (starts with mock-), use a dummy integer ID
            let parsedKamarId = parseInt(kamar);
            if (isNaN(parsedKamarId)) {
                // Find a default ID or fail if backend requires true relation
                parsedKamarId = 1;
            }

            // Convert MM/DD/YYYY date to YYYY-MM-DD SQL format
            let tanggalMasukSql = tglMasuk;
            if (tglMasuk.includes("/")) {
                const [month, day, year] = tglMasuk.split("/");
                tanggalMasukSql = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }

            await apiClient.post("/admin/penghuni", {
                nama_lengkap: nama.trim(),
                email: email.trim(),
                password: password,
                no_hp: noHp.trim(),
                alamat_asal: alamatAsal.trim() || undefined,
                id_kamar: parsedKamarId,
                tanggal_masuk: tanggalMasukSql,
                durasi_sewa_bulan: parseInt(durasiBulan) || 1,
            });

            Alert.alert("Sukses", "Penghuni baru berhasil disimpan ke server.");
            router.back();
        } catch (err: any) {
            console.log("Error saving tenant:", err?.response?.data || err);
            const validationErrors = err?.response?.data?.errors;
            let errorMessage = "Gagal menyimpan penghuni ke database.";
            
            if (validationErrors) {
                const firstError = Object.values(validationErrors)[0] as string[];
                errorMessage = firstError?.[0] || errorMessage;
            } else if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            Alert.alert("Gagal Menyimpan", errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return {
        nama, setNama,
        noHp, setNoHp,
        email, setEmail,
        password, setPassword,
        alamatAsal, setAlamatAsal,
        tipeKamar, setTipeKamar,
        kamar, setKamar,
        tglMasuk, setTglMasuk,
        durasiBulan, setDurasiBulan,
        totalTagihan,
        estimasiCheckOut,
        formatCurrency,
        handleSave,
        handleCancel,
        roomData,
        isSaving,
        isLoadingRooms,
    };
}
