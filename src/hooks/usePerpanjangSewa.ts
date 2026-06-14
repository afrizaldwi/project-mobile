import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sewaService } from "@/api/sewaService";
import { markPenghuniCacheDirty } from "@/database/penghuniRepository";
import { synchronizePenghuniCache } from "@/database/penghuniSync";
import { getConnectivityStatus } from "@/network/connectivity";
import { SewaExtensionBuilder } from "@/services/sewa/SewaExtensionBuilder";
import { getErrorMessage } from "@/utils/apiErrors";
import type { Penghuni as SewaExtensionDetail } from "@/types/penghuni";

export function usePerpanjangSewa(
    idSewa: number,
    initialHarga?: number,
    initialTanggalKeluar?: string,
) {
    const db = useSQLiteContext();

    const [durasi, setDurasi] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [detail, setDetail] = useState<SewaExtensionDetail | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
        if (!idSewa) {
            setDetailError("ID sewa tidak valid.");
            return;
        }

        let mounted = true;

        sewaService.fetchDetail(idSewa)
            .then((data) => {
                if (!mounted) return;
                setDetail(data);
                setDetailError(null);
            })
            .catch((error: any) => {
                if (!mounted) return;
                setDetailError(getErrorMessage(error, "Gagal memuat detail sewa."));
            })
            .finally(() => {
                if (mounted) setIsLoadingDetail(false);
            });

        return () => { mounted = false; };
    }, [idSewa]);

    const hargaBulanan = Number(detail?.harga_bulanan ?? initialHarga ?? 0);
    const tanggalKeluar = detail?.tanggal_keluar || initialTanggalKeluar || "";

    const { totalTagihan, estimasiKeluar } = useMemo(() => {
        const b = new SewaExtensionBuilder()
            .setTanggalMulai(tanggalKeluar)
            .setDurasi(durasi)
            .setHargaBulanan(hargaBulanan);
        return {
            totalTagihan: b.hitungTotal(),
            estimasiKeluar: b.hitungEstimasi(),
        };
    }, [durasi, hargaBulanan, tanggalKeluar]);

    const tambahDurasi = useCallback(() => {
        setDurasi((d) => (d < 24 ? d + 1 : d));
    }, []);

    const kurangDurasi = useCallback(() => {
        setDurasi((d) => (d > 1 ? d - 1 : d));
    }, []);

    const detailRef = useRef(detail);
    detailRef.current = detail;

    const initialHargaRef = useRef(initialHarga);
    initialHargaRef.current = initialHarga;
    const initialTanggalKeluarRef = useRef(initialTanggalKeluar);
    initialTanggalKeluarRef.current = initialTanggalKeluar;

    const handleSimpan = useCallback(async () => {
        if (await getConnectivityStatus() === "offline") {
            return { error: "Koneksi Diperlukan", message: "Tindakan ini membutuhkan koneksi internet." };
        }
        if (!idSewa) return { error: "Gagal", message: "ID sewa tidak valid." };

        const tglKeluar = detailRef.current?.tanggal_keluar || initialTanggalKeluarRef.current || "";
        if (!tglKeluar || tglKeluar === "—" || tglKeluar === "-") {
            return { error: "Gagal", message: "Tanggal keluar sewa saat ini tidak tersedia." };
        }
        const hrgBln = detailRef.current?.harga_bulanan
            ? Number(detailRef.current.harga_bulanan)
            : (initialHargaRef.current ?? 0);
        if (hrgBln <= 0) {
            return { error: "Gagal", message: "Harga bulanan kamar tidak valid." };
        }

        const builder = new SewaExtensionBuilder()
            .setTanggalMulai(tglKeluar)
            .setDurasi(durasi)
            .setHargaBulanan(hrgBln);

        setLoading(true);
        try {
            const payload = builder.build();
            const response = await sewaService.perpanjang(idSewa, payload);
            markPenghuniCacheDirty(db).catch(() => undefined);
            synchronizePenghuniCache(db).catch(() => undefined);
            return { success: true, message: response?.message || "Sewa berhasil diperpanjang dan tagihan baru berhasil dibuat." };
        } catch (err: any) {
            return { error: "Gagal", message: getErrorMessage(err, "Terjadi kesalahan. Coba lagi.") };
        } finally {
            setLoading(false);
        }
    }, [idSewa, db, durasi]);

    return {
        durasi, setDurasi,
        loading, isLoadingDetail, detailError,
        detail,
        nama: detail?.nama || "",
        nomorKamar: detail?.nomor_kamar || "",
        tanggalMasuk: detail?.tanggal_masuk || "",
        tanggalKeluar: detail?.tanggal_keluar || "",
        harga: Number(detail?.harga_bulanan ?? initialHarga ?? 0),
        totalTagihan, estimasiKeluar,
        tambahDurasi, kurangDurasi,
        handleSimpan,
    };
}
