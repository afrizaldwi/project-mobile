import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { PenghuniAktif } from "@/types/tamu";

import { FormTextField } from "./FormTextField";
import { PenghuniSelectField } from "./PenghuniSelectField";

interface TambahTamuFormProps {
    nama: string;
    noHp: string;
    keperluan: string;
    selectedPenghuni?: PenghuniAktif;
    isSubmitting: boolean;
    onNamaChange: (text: string) => void;
    onNoHpChange: (text: string) => void;
    onKeperluanChange: (text: string) => void;
    onOpenPenghuniPicker: () => void;
    onSubmit: () => void;
}

export function TambahTamuForm({
    nama,
    noHp,
    keperluan,
    selectedPenghuni,
    isSubmitting,
    onNamaChange,
    onNoHpChange,
    onKeperluanChange,
    onOpenPenghuniPicker,
    onSubmit,
}: TambahTamuFormProps) {
    return (
        <View className="px-6 pb-12">
            <PenghuniSelectField
                selectedPenghuni={selectedPenghuni}
                onPress={onOpenPenghuniPicker}
            />

            <FormTextField
                label="Nama Lengkap Tamu"
                value={nama}
                onChangeText={onNamaChange}
                placeholder="Contoh: Budi Santoso"
            />

            <FormTextField
                label="Nomor HP"
                value={noHp}
                onChangeText={onNoHpChange}
                placeholder="Contoh: 08123456789"
                keyboardType="phone-pad"
            />

            <FormTextField
                label="Keperluan Kunjungan"
                value={keperluan}
                onChangeText={onKeperluanChange}
                placeholder="Contoh: Mengantar paket..."
                multiline
                numberOfLines={4}
            />

            <Pressable
                onPress={onSubmit}
                disabled={isSubmitting}
                className={`items-center justify-center rounded-xl py-4 ${
                    isSubmitting ? "bg-gray-400" : "bg-primary"
                }`}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-lg font-bold text-white">Simpan Data Tamu</Text>
                )}
            </Pressable>
        </View>
    );
}
