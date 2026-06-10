import { laporanService, type LaporanKeuanganResponse } from "@/api/laporanService";
import {
    markLaporanKeuanganDirty,
    readLaporanKeuanganSnapshot,
    validateLaporanPeriod,
} from "@/database/laporanKeuanganRepository";
import { syncLaporanKeuangan } from "@/database/laporanKeuanganSync";
import { getConnectivityStatus } from "@/network/connectivity";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

const initialDate = new Date();
const currentYear = initialDate.getFullYear();
const periodKey = (bulan: number, tahun: number) =>
    `${tahun}-${String(bulan).padStart(2, "0")}`;
const formatLocalDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
    ).padStart(2, "0")}`;
const parseExpensePeriod = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const tahun = Number(match[1]);
    const bulan = Number(match[2]);
    try {
        validateLaporanPeriod(bulan, tahun);
        return { bulan, tahun };
    } catch {
        return null;
    }
};
const getErrorMessage = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || fallback;

export function useLaporanKeuangan() {
    const db = useSQLiteContext();
    const [bulan, setBulan] = useState(initialDate.getMonth() + 1);
    const [tahun, setTahun] = useState(currentYear);
    const [data, setData] = useState<LaporanKeuanganResponse | null>(null);
    const [dataPeriod, setDataPeriod] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [notice, setNotice] = useState("");
    const generation = useRef(0);
    const selectedKey = periodKey(bulan, tahun);
    const visibleData = dataPeriod === selectedKey ? data : null;

    const yearOptions = useMemo(
        () => Array.from({ length: 6 }, (_, index) => currentYear - index),
        [],
    );
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
        [],
    );
    const [form, setForm] = useState({
        judul_pengeluaran: "",
        deskripsi: "",
        jumlah_pengeluaran: "",
        tanggal_pengeluaran: formatLocalDate(initialDate),
    });

    const loadLocal = useCallback(
        async (targetBulan: number, targetTahun: number, token: number) => {
            try {
                const report = await readLaporanKeuanganSnapshot(
                    db,
                    targetBulan,
                    targetTahun,
                );
                if (generation.current !== token) return false;
                setData(report);
                setDataPeriod(periodKey(targetBulan, targetTahun));
                setErrorMessage("");
                return true;
            } catch (error) {
                if (__DEV__)
                    console.warn(
                        `[LAPORAN UI] Local snapshot unavailable. Period: ${periodKey(targetBulan, targetTahun)}`,
                        error,
                    );
                return false;
            }
        },
        [db],
    );

    const synchronizeAndReload = useCallback(
        async (
            targetBulan: number,
            targetTahun: number,
            token: number,
            usable: boolean,
            showRefresh = false,
        ) => {
            if (showRefresh && generation.current === token) setIsRefreshing(true);
            try {
                if ((await getConnectivityStatus()) === "offline") {
                    if (generation.current !== token) return;
                    if (usable) {
                        setErrorMessage("");
                        setNotice(
                            "Offline. Menampilkan laporan keuangan yang tersimpan di perangkat.",
                        );
                    } else {
                        setNotice("");
                        setErrorMessage(
                            "Laporan keuangan tersimpan tidak valid dan tidak dapat diperbarui saat offline.",
                        );
                    }
                    return;
                }
                await syncLaporanKeuangan(db, targetBulan, targetTahun, showRefresh);
                if (generation.current !== token) return;
                const loaded = await loadLocal(targetBulan, targetTahun, token);
                if (!loaded) throw new Error("Laporan hasil sinkronisasi tidak valid.");
                if (generation.current === token) {
                    setErrorMessage("");
                    setNotice("");
                }
            } catch (error) {
                if (generation.current !== token) return;
                if (usable) {
                    setErrorMessage("");
                    setNotice(
                        "Sinkronisasi laporan keuangan gagal. Menampilkan data tersimpan.",
                    );
                } else {
                    setErrorMessage(
                        "Laporan keuangan belum tersedia dan sinkronisasi tidak dapat diselesaikan.",
                    );
                }
                if (__DEV__)
                    console.error(
                        `[LAPORAN UI] Refresh failed. Period: ${periodKey(targetBulan, targetTahun)}`,
                        error,
                    );
            } finally {
                if (generation.current === token) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        },
        [db, loadLocal],
    );

    useEffect(() => {
        const generationRef = generation;
        const token = ++generation.current;
        setData(null);
        setDataPeriod("");
        setErrorMessage("");
        setNotice("");
        setIsRefreshing(false);
        setIsLoading(true);
        void (async () => {
            const usable = await loadLocal(bulan, tahun, token);
            if (generation.current !== token) return;
            if (usable) setIsLoading(false);
            await synchronizeAndReload(bulan, tahun, token, usable);
        })().catch((error) => {
            if (generation.current === token) {
                setErrorMessage("Gagal menyiapkan laporan keuangan lokal.");
                setIsLoading(false);
                if (__DEV__)
                    console.error(
                        `[LAPORAN UI] Initial load failed. Period: ${selectedKey}`,
                        error,
                    );
            }
        });
        return () => {
            generationRef.current++;
        };
    }, [bulan, loadLocal, selectedKey, synchronizeAndReload, tahun]);

    const refresh = useCallback(() => {
        const token = generation.current;
        void synchronizeAndReload(bulan, tahun, token, visibleData !== null, true);
    }, [bulan, synchronizeAndReload, tahun, visibleData]);

    const refreshAfterMutation = useCallback(
        async (targetBulan: number, targetTahun: number) => {
            const token = generation.current;
            await markLaporanKeuanganDirty(db, targetBulan, targetTahun);
            if (targetBulan !== bulan || targetTahun !== tahun) return;
            await syncLaporanKeuangan(db, targetBulan, targetTahun, true);
            if (generation.current !== token) return;
            if (!(await loadLocal(targetBulan, targetTahun, token)))
                throw new Error("Cache laporan keuangan gagal dimuat ulang.");
            setNotice("");
            setErrorMessage("");
        },
        [bulan, db, loadLocal, tahun],
    );

    const handleSubmitExpense = async () => {
        if (!form.judul_pengeluaran.trim()) {
            Alert.alert("Error", "Keterangan wajib diisi.");
            return;
        }
        if (
            !form.jumlah_pengeluaran.trim() ||
            isNaN(Number(form.jumlah_pengeluaran)) ||
            Number(form.jumlah_pengeluaran) <= 0
        ) {
            Alert.alert("Error", "Jumlah pengeluaran harus berupa angka positif.");
            return;
        }
        const affected = parseExpensePeriod(form.tanggal_pengeluaran);
        if (!affected) {
            Alert.alert("Error", "Tanggal wajib diisi.");
            return;
        }
        if ((await getConnectivityStatus()) === "offline") {
            Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet.");
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
            setForm({
                judul_pengeluaran: "",
                deskripsi: "",
                jumlah_pengeluaran: "",
                tanggal_pengeluaran: formatLocalDate(new Date()),
            });
            setShowExpenseForm(false);
            try {
                await refreshAfterMutation(affected.bulan, affected.tahun);
                Alert.alert("Sukses", "Pengeluaran berhasil dicatat.");
            } catch {
                setNotice(
                    "Pengeluaran tersimpan di server, tetapi cache laporan belum berhasil diperbarui.",
                );
                Alert.alert(
                    "Pengeluaran Tersimpan",
                    "Pengeluaran tersimpan di server, tetapi cache lokal belum berhasil diperbarui.",
                );
            }
        } catch (error) {
            const validationErrors = (
                error as { response?: { data?: { errors?: Record<string, string[]> } } }
            )?.response?.data?.errors;
            if (validationErrors) {
                const firstError = Object.values(validationErrors)[0];
                setErrorMessage(firstError?.[0] || "Validasi gagal.");
            } else {
                setErrorMessage(getErrorMessage(error, "Gagal mencatat pengeluaran."));
            }
            Alert.alert("Gagal", "Gagal menyimpan pengeluaran.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (idPengeluaran: number) => {
        if ((await getConnectivityStatus()) === "offline") {
            Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet.");
            return;
        }
        try {
            await laporanService.deletePengeluaran(idPengeluaran);
            try {
                await refreshAfterMutation(bulan, tahun);
                Alert.alert("Sukses", "Pengeluaran berhasil dihapus.");
            } catch {
                setNotice(
                    "Pengeluaran terhapus di server, tetapi cache laporan belum berhasil diperbarui.",
                );
                Alert.alert(
                    "Pengeluaran Terhapus",
                    "Pengeluaran terhapus di server, tetapi cache lokal belum berhasil diperbarui.",
                );
            }
        } catch {
            Alert.alert("Gagal", "Gagal menghapus pengeluaran.");
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    return {
        bulan,
        setBulan,
        tahun,
        setTahun,
        data: visibleData,
        isLoading,
        isRefreshing,
        isSubmitting,
        showExpenseForm,
        setShowExpenseForm,
        errorMessage,
        setErrorMessage,
        notice,
        yearOptions,
        monthOptions,
        form,
        setForm,
        fetchData: refresh,
        refresh,
        handleSubmitExpense,
        handleDeleteExpense,
        formatCurrency,
    };
}
