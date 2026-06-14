import { laporanService } from "@/api/laporanService";
import type { LaporanKeuanganResponse, PengeluaranFormState } from "@/types/laporan";
import {
    markLaporanKeuanganDirty,
    readLaporanKeuanganSnapshot,
    validateLaporanPeriod,
} from "@/database/laporanKeuanganRepository";
import { syncLaporanKeuangan } from "@/database/laporanKeuanganSync";
import { getConnectivityStatus } from "@/network/connectivity";
import { getApiErrorMessage, getFirstValidationError } from "@/utils/errorUtils";
import { formatCurrency, formatLocalDate } from "@/utils/formatUtils";
import { useOfflineGuard } from "@/hooks/useOfflineGuard";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Konstanta ─────────────────────────────────────────────────────────────────

const initialDate = new Date();
const currentYear = initialDate.getFullYear();

// ─── Helper functions ──────────────────────────────────────────────────────────

function periodKey(bulan: number, tahun: number): string {
    return `${tahun}-${String(bulan).padStart(2, "0")}`;
}

function parseExpensePeriod(value: string): { bulan: number; tahun: number } | null {
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
}

/** Validasi form pengeluaran. Mengembalikan pesan error atau null jika valid. */
function validateExpenseForm(form: PengeluaranFormState): string | null {
    if (!form.judul_pengeluaran.trim()) return "Keterangan wajib diisi.";
    const jumlah = Number(form.jumlah_pengeluaran);
    if (!form.jumlah_pengeluaran.trim() || isNaN(jumlah) || jumlah <= 0)
        return "Jumlah pengeluaran harus berupa angka positif.";
    if (!parseExpensePeriod(form.tanggal_pengeluaran))
        return "Tanggal wajib diisi dengan format YYYY-MM-DD.";
    return null;
}

// ─── State untuk konfirmasi hapus pengeluaran (poin 8) ────────────────────────

export interface DeletePengeluaranConfirmState {
    visible: boolean;
    idPengeluaran: number | null;
    judulPengeluaran: string;
    jumlahPengeluaran: number;
    tanggalPengeluaran: string;
}

const INITIAL_DELETE_STATE: DeletePengeluaranConfirmState = {
    visible: false,
    idPengeluaran: null,
    judulPengeluaran: "",
    jumlahPengeluaran: 0,
    tanggalPengeluaran: "",
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useLaporanKeuangan() {
    const db = useSQLiteContext();
    const isOffline = useOfflineGuard();
    const [bulan, setBulan] = useState(initialDate.getMonth() + 1);
    const [tahun, setTahun] = useState(currentYear);
    const [data, setData] = useState<LaporanKeuanganResponse | null>(null);
    const [dataPeriod, setDataPeriod] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [notice, setNotice] = useState("");
    const generation = useRef(0);

    /** State untuk modal konfirmasi sebelum hapus pengeluaran (poin 8) */
    const [deleteConfirm, setDeleteConfirm] =
        useState<DeletePengeluaranConfirmState>(INITIAL_DELETE_STATE);

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

    const [form, setForm] = useState<PengeluaranFormState>({
        judul_pengeluaran: "",
        deskripsi: "",
        jumlah_pengeluaran: "",
        tanggal_pengeluaran: formatLocalDate(initialDate),
    });

    // ─── Load dari cache lokal ─────────────────────────────────────────────────

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

    // ─── Sinkronisasi dan reload ───────────────────────────────────────────────

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
                const connectivity = await getConnectivityStatus();
                // Treat 'unknown' sebagai online agar sync tetap dicoba
                if (connectivity === "offline") {
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
                    // Pastikan loading state selalu diselesaikan saat offline
                    setIsLoading(false);
                    setIsRefreshing(false);
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
            } catch {
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
            // Tangkap token sebelum operasi async dimulai untuk cegah race condition
            const token = generation.current;
            await markLaporanKeuanganDirty(db, targetBulan, targetTahun);
            if (targetBulan !== bulan || targetTahun !== tahun) return;

            // Delay singkat agar server punya waktu memproses data baru sebelum di-fetch ulang
            await new Promise((resolve) => setTimeout(resolve, 400));

            // Coba sinkronisasi pertama kali
            try {
                await syncLaporanKeuangan(db, targetBulan, targetTahun, true);
            } catch {
                // Jika gagal, tunggu sebentar lalu coba sekali lagi (retry)
                await new Promise((resolve) => setTimeout(resolve, 1000));
                try {
                    await syncLaporanKeuangan(db, targetBulan, targetTahun, true);
                } catch {
                    // Kedua sync gagal — tetap lanjut dan coba tampilkan cache lama
                    if (__DEV__)
                        console.warn("[LAPORAN] refreshAfterMutation: kedua sync gagal, fallback ke cache lokal.");
                }
            }

            // Pastikan generasi belum berubah sebelum update state
            if (generation.current !== token) return;

            const loaded = await loadLocal(targetBulan, targetTahun, token);
            if (!loaded) throw new Error("Cache laporan keuangan gagal dimuat ulang setelah mutasi.");

            if (generation.current === token) {
                setNotice("");
                setErrorMessage("");
            }
        },
        [bulan, db, loadLocal, tahun],
    );

    // ─── Submit pengeluaran baru ───────────────────────────────────────────────

    const handleSubmitExpense = async () => {
        const validationError = validateExpenseForm(form);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }
        if ((await getConnectivityStatus()) === "offline") {
            setErrorMessage("Tindakan ini membutuhkan koneksi internet.");
            return;
        }
        const affected = parseExpensePeriod(form.tanggal_pengeluaran)!;
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
            } catch {
                setNotice(
                    "Pengeluaran tersimpan di server, tetapi cache laporan belum berhasil diperbarui.",
                );
            }
        } catch (error) {
            const firstValidation = getFirstValidationError(error);
            setErrorMessage(
                firstValidation || getApiErrorMessage(error, "Gagal mencatat pengeluaran."),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Hapus pengeluaran — dengan konfirmasi dua langkah (poin 8) ───────────

    /**
     * Langkah 1: Tampilkan modal konfirmasi dengan ringkasan data pengeluaran.
     * Pengguna harus melihat detail sebelum bisa menghapus.
     */
    /**
     * Langkah 1: Tampilkan modal konfirmasi dengan ringkasan data pengeluaran.
     * Pengguna harus melihat detail sebelum bisa menghapus.
     * Cek koneksi dilakukan di Langkah 2 (confirmDeleteExpense) saat eksekusi.
     */
    const requestDeleteExpense = useCallback(
        (
            idPengeluaran: number,
            judulPengeluaran: string,
            jumlahPengeluaran: number,
            tanggalPengeluaran: string,
        ) => {
            setDeleteConfirm({
                visible: true,
                idPengeluaran,
                judulPengeluaran,
                jumlahPengeluaran,
                tanggalPengeluaran,
            });
        },
        [],
    );

    /** Langkah 2: Pengguna menekan "Hapus" pada modal — eksekusi penghapusan. */
    const confirmDeleteExpense = useCallback(async () => {
        if (!deleteConfirm.idPengeluaran) return;
        const idPengeluaran = deleteConfirm.idPengeluaran;
        setDeleteConfirm(INITIAL_DELETE_STATE);
        if ((await getConnectivityStatus()) === "offline") {
            setErrorMessage("Tindakan ini membutuhkan koneksi internet.");
            return;
        }
        setIsDeleting(true);
        try {
            await laporanService.deletePengeluaran(idPengeluaran);
            try {
                await refreshAfterMutation(bulan, tahun);
            } catch {
                setNotice(
                    "Pengeluaran terhapus di server, tetapi cache laporan belum berhasil diperbarui.",
                );
            }
        } catch {
            setErrorMessage("Gagal menghapus pengeluaran.");
        } finally {
            setIsDeleting(false);
        }
    }, [bulan, deleteConfirm.idPengeluaran, refreshAfterMutation, tahun]);

    /** Pengguna menekan "Batal" pada modal konfirmasi hapus. */
    const cancelDeleteExpense = useCallback(() => {
        setDeleteConfirm(INITIAL_DELETE_STATE);
    }, []);

    return {
        bulan,
        setBulan,
        tahun,
        setTahun,
        data: visibleData,
        isLoading,
        isRefreshing,
        isSubmitting,
        isDeleting,
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
        /** Status koneksi reaktif — true jika perangkat sedang offline */
        isOffline,
        /** State modal konfirmasi sebelum hapus pengeluaran */
        deleteConfirm,
        /** Langkah 1: Minta konfirmasi hapus (tampilkan modal) */
        requestDeleteExpense,
        /** Langkah 2: Eksekusi hapus setelah pengguna konfirmasi */
        confirmDeleteExpense,
        /** Batalkan hapus */
        cancelDeleteExpense,
        /** Fungsi format currency — disediakan dari utils, bukan didefinisikan ulang */
        formatCurrency,
        /** @deprecated Gunakan requestDeleteExpense untuk konfirmasi dua langkah */
        handleDeleteExpense: (id: number) =>
            requestDeleteExpense(id, "", 0, ""),
    };
}
