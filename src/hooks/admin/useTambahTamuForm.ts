import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

import { tamuService, PenghuniAktif } from "@/api/tamuService";

export function useTambahTamuForm() {
    const router = useRouter();
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
            try {
                const data = await tamuService.getPenghuniAktif();
                setPenghuniList(data);
            } catch (error) {
                console.error("Failed to fetch penghuni:", error);
            } finally {
                setLoadingPenghuni(false);
            }
        };

        fetchPenghuniAktif();
    }, []);

    const selectedPenghuni = penghuniList.find((p) => p.id_user === idUser);

    const handleSubmit = async () => {
        if (!nama.trim() || !noHp.trim() || !keperluan.trim() || !idUser) {
            Alert.alert("Validasi Error", "Semua kolom dan penghuni yang dituju wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        try {
            await tamuService.createAdminTamu({
                nama_tamu: nama,
                no_hp_tamu: noHp,
                keperluan: keperluan,
                id_user: idUser,
            });

            Alert.alert("Sukses", "Data tamu berhasil ditambahkan.", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error: any) {
            console.error("Failed to submit tamu:", error);
            Alert.alert(
                "Error",
                error.response?.data?.message || "Terjadi kesalahan saat menambahkan tamu."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectPenghuni = (userId: number) => {
        setIdUser(userId);
        setModalVisible(false);
    };

    return {
        nama,
        setNama,
        noHp,
        setNoHp,
        keperluan,
        setKeperluan,
        selectedPenghuni,
        isSubmitting,
        penghuniList,
        loadingPenghuni,
        modalVisible,
        setModalVisible,
        handleSubmit,
        selectPenghuni,
    };
}
