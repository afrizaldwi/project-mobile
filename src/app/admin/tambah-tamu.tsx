import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { PenghuniPickerModal } from "@/components/admin/tamu/PenghuniPickerModal";
import { TambahTamuForm } from "@/components/admin/tamu/TambahTamuForm";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTambahTamuForm } from "@/hooks/admin/useTambahTamuForm";

export default function AdminTambahTamuScreen() {
    const form = useTambahTamuForm();

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView className="flex-1 bg-secondary">
                    <ScreenHeader
                        title="Tambah Tamu"
                        subtitle="Catat kunjungan tamu untuk penghuni"
                    />
                    <TambahTamuForm
                        nama={form.nama}
                        noHp={form.noHp}
                        keperluan={form.keperluan}
                        selectedPenghuni={form.selectedPenghuni}
                        isSubmitting={form.isSubmitting}
                        onNamaChange={form.setNama}
                        onNoHpChange={form.setNoHp}
                        onKeperluanChange={form.setKeperluan}
                        onOpenPenghuniPicker={() => form.setModalVisible(true)}
                        onSubmit={form.handleSubmit}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <PenghuniPickerModal
                visible={form.modalVisible}
                loading={form.loadingPenghuni}
                penghuniList={form.penghuniList}
                onClose={() => form.setModalVisible(false)}
                onSelect={form.selectPenghuni}
            />
        </ProtectedRoute>
    );
}
