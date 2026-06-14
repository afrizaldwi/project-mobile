import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

import { tamuService } from "@/api/tamuService";
import type { PenghuniAktif } from "@/types/tamu";
import { markTamuCacheDirty } from "@/database/tamuRepository";
import { getConnectivityStatus } from "@/network/connectivity";

export function useTambahTamuForm() {
    const router = useRouter();
    const db = useSQLiteContext();
    const [nama, setNama] = useState("");
    const [noHp, setNoHp] = useState("");
    const [keperluan, setKeperluan] = useState("");
    const [idUser, setIdUser] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [penghuniList, setPenghuniList] = useState<PenghuniAktif[]>([]);
    const [loadingPenghuni, setLoadingPenghuni] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchPenghuniAktif = async () => {
            try { setPenghuniList(await tamuService.getPenghuniAktif()); }
            catch (error) { console.error("Failed to fetch penghuni:", error); }
            finally { setLoadingPenghuni(false); }
        };
        void fetchPenghuniAktif();
    }, []);

    const selectedPenghuni = penghuniList.find((penghuni) => penghuni.id_user === idUser);

    const confirmThenSubmit = () => {
        if (!nama.trim() || !noHp.trim() || !keperluan.trim() || !idUser) {
            Alert.alert("Validasi Error", "Semua kolom dan penghuni yang dituju wajib diisi.");
            return;
        }
        Alert.alert(
            "Konfirmasi",
            "Apakah Anda yakin ingin menambahkan data tamu ini?",
            [
                { text: "Batal", style: "cancel" },
                { text: "Ya, Tambahkan", onPress: handleSubmit },
            ]
        );
    };

    const handleSubmit = async () => {
        if (await getConnectivityStatus() === "offline") {
            Alert.alert("Koneksi Diperlukan", "Tindakan ini membutuhkan koneksi internet.");
            return;
        }
        setIsSubmitting(true);
        try {
            await tamuService.createAdminTamu({ nama_tamu: nama, no_hp_tamu: noHp, keperluan, id_user: idUser ?? undefined });
            try {
                await markTamuCacheDirty(db);
            } catch (cacheError) {
                console.error("Failed to mark TAMU cache dirty:", cacheError);
            }
            Alert.alert("Sukses", "Data tamu berhasil ditambahkan.", [{ text: "OK", onPress: () => router.back() }]);
        } catch (error: unknown) {
            console.error("Failed to submit tamu:", error);
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Alert.alert("Error", message || "Terjadi kesalahan saat menambahkan tamu. Tindakan ini membutuhkan koneksi internet.");
        } finally { setIsSubmitting(false); }
    };

    const selectPenghuni = (userId: number) => { setIdUser(userId); setModalVisible(false); };
    return {
        nama, setNama, noHp, setNoHp, keperluan, setKeperluan, selectedPenghuni, isSubmitting,
        penghuniList, loadingPenghuni, modalVisible, setModalVisible, handleSubmit: confirmThenSubmit, selectPenghuni,
    };
}
