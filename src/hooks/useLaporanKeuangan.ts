import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { laporanService, type LaporanKeuanganResponse } from "@/api/laporanService";

export function useLaporanKeuangan() {
    const now = new Date();
    const [bulan, setBulan] = useState<number>(now.getMonth() + 1);
    const [tahun, setTahun] = useState<number>(now.getFullYear());
    const [data, setData] = useState<LaporanKeuanganResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showExpenseForm, setShowExpenseForm] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const yearOptions = useMemo(() => {
        const currentYear = now.getFullYear();
        // Return 6 years: current year down to currentYear - 5
        return Array.from({ length: 6 }, (_, index) => currentYear - index);
    }, []);

    const monthOptions = useMemo(
        () => [
            { value: 1, label: "Januari" },
            { value: 2, label: "Februari" },
            { value: 3, label: "Maret" },
            { value: 4, label: "April" },
            { value: 5, label: "Mei" },
            { value: 6, label: "Juni" },
            { value: 7, label: "Juli" },
            { value: 8, label: "Agustus" },
            { value: 9, label: "September" },
            { value: 10, label: "Oktober" },
            { value: 11, label: "November" },
            { value: 12, label: "Desember" },
        ],
        []
    );

    // Form inputs state
    const [form, setForm] = useState({
        judul_pengeluaran: "",
        deskripsi: "",
        jumlah_pengeluaran: "",
        tanggal_pengeluaran: now.toISOString().slice(0, 10), // Format YYYY-MM-DD
    });

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");
            const res = await laporanService.getLaporanKeuangan(bulan, tahun);
            setData(res);
        } catch (err: any) {
            setErrorMessage("Gagal memuat laporan keuangan.");
            console.log("Error fetching laporan:", err);
        } finally {
            setIsLoading(false);
        }
    }, [bulan, tahun]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmitExpense = async () => {
        if (!form.judul_pengeluaran.trim()) {
            Alert.alert("Error", "Keterangan wajib diisi.");
            return;
        }
        if (!form.jumlah_pengeluaran.trim() || isNaN(Number(form.jumlah_pengeluaran)) || Number(form.jumlah_pengeluaran) <= 0) {
            Alert.alert("Error", "Jumlah pengeluaran harus berupa angka positif.");
            return;
        }
        if (!form.tanggal_pengeluaran.trim()) {
            Alert.alert("Error", "Tanggal wajib diisi.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");

            await laporanService.createPengeluaran({
                judul_pengeluaran: form.judul_pengeluaran.trim(),
                deskripsi: form.deskripsi.trim() || undefined,
                jumlah_pengeluaran: Number(form.jumlah_pengeluaran),
                tanggal_pengeluaran: form.tanggal_pengeluaran,
            });

            // Reset Form
            setForm({
                judul_pengeluaran: "",
                deskripsi: "",
                jumlah_pengeluaran: "",
                tanggal_pengeluaran: new Date().toISOString().slice(0, 10),
            });

            setShowExpenseForm(false);
            Alert.alert("Sukses", "Pengeluaran berhasil dicatat.");
            await fetchData();
        } catch (err: any) {
            const validationErrors = err?.response?.data?.errors;
            if (validationErrors) {
                const firstError = Object.values(validationErrors)[0] as string[];
                setErrorMessage(firstError?.[0] || "Validasi gagal.");
            } else {
                setErrorMessage(err?.response?.data?.message || "Gagal mencatat pengeluaran.");
            }
            Alert.alert("Gagal", "Gagal menyimpan pengeluaran.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (idPengeluaran: number) => {
        Alert.alert(
            "Konfirmasi Hapus",
            "Apakah Anda yakin ingin menghapus pengeluaran ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await laporanService.deletePengeluaran(idPengeluaran);
                            Alert.alert("Sukses", "Pengeluaran berhasil dihapus.");
                            await fetchData();
                        } catch (err: any) {
                            Alert.alert("Gagal", "Gagal menghapus pengeluaran.");
                        }
                    },
                },
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return {
        bulan,
        setBulan,
        tahun,
        setTahun,
        data,
        isLoading,
        isSubmitting,
        showExpenseForm,
        setShowExpenseForm,
        errorMessage,
        setErrorMessage,
        yearOptions,
        monthOptions,
        form,
        setForm,
        fetchData,
        handleSubmitExpense,
        handleDeleteExpense,
        formatCurrency,
    };
}
