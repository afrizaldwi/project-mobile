import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { PasswordChangeSection } from "@/components/profile/PasswordChangeSection";
import { useProfile } from "@/hooks/useProfile";
import type { UserRole } from "@/types";

type ProfileScreenContentProps = {
    role: UserRole;
    title: string;
    subtitle: string;
};

function roleLabel(role?: string | null) {
    if (role === "admin") return "Admin";
    if (role === "penyewa") return "Penyewa";
    return role || "-";
}

function valueOrDash(value: unknown) {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
    return (
        <View className="border-b border-gray-100 py-3 last:border-b-0">
            <Text className="text-xs font-bold uppercase text-gray-400">{label}</Text>
            <Text className="mt-1 text-base font-semibold text-dark">{valueOrDash(value)}</Text>
        </View>
    );
}

export function ProfileScreenContent({ role, title, subtitle }: ProfileScreenContentProps) {
    const {
        profile,
        loading,
        refreshing,
        notice,
        error,
        isPartial,
        refresh,
    } = useProfile(role);
    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const sewaRows = useMemo(() => {
        if (role !== "penyewa" || !profile) return [];

        const sewa = profile.sewa;
        const kamar = profile.kamar;
        const rows: { label: string; value: unknown }[] = [];
        rows.push({ label: "Nomor Kamar", value: kamar?.nomor_kamar ?? null });
        rows.push({ label: "Status Kamar", value: kamar?.status_kamar ?? null });
        rows.push({ label: "Tanggal Masuk", value: sewa?.tanggal_masuk ?? null });
        rows.push({ label: "Tanggal Keluar", value: sewa?.tanggal_keluar ?? null });
        rows.push({
            label: "Status Sewa",
            value: sewa?.status_sewa ?? profile.status_sewa ?? null,
        });

        return rows.filter((row) => !isPartial || row.value !== null);
    }, [isPartial, profile, role]);

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
        });

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const scrollToPasswordForm = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 250);
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-secondary"
            behavior="height"
            keyboardVerticalOffset={0}
        >
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 bg-secondary px-5 pt-5"
                contentContainerStyle={{
                    paddingBottom: keyboardVisible ? 400 : 32,
                }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} />
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-2xl font-extrabold text-dark">{title}</Text>
                <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>

                {loading && !profile ? (
                    <View className="mt-6 items-center rounded-xl bg-white p-6">
                        <ActivityIndicator color="#2563eb" />
                        <Text className="mt-3 text-sm font-semibold text-gray-500">
                            Memuat profil...
                        </Text>
                    </View>
                ) : error && !profile ? (
                    <View className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
                        <Text className="text-sm font-semibold text-red-700">{error}</Text>
                        <TouchableOpacity
                            onPress={refresh}
                            className="mt-3 rounded-lg bg-red-600 px-4 py-3"
                        >
                            <Text className="text-center text-sm font-bold text-white">
                                Coba Lagi
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : profile ? (
                    <>
                        {notice ? (
                            <View className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <Text className="text-sm font-semibold text-primary">
                                    {notice}
                                </Text>
                            </View>
                        ) : null}
                        {error ? (
                            <View className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
                                <Text className="text-sm font-semibold text-red-700">
                                    {error}
                                </Text>
                            </View>
                        ) : null}
                        <View className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <Text className="mb-2 text-lg font-bold text-dark">
                                Informasi Akun
                            </Text>
                            <InfoRow label="Nama Lengkap" value={profile.nama_lengkap} />
                            <InfoRow label="Email" value={profile.email} />
                            <InfoRow label="Role" value={roleLabel(profile.role)} />
                            <InfoRow label="Nomor HP" value={profile.no_hp} />
                        </View>

                        {sewaRows.length > 0 ? (
                            <View className="mt-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <Text className="mb-2 text-lg font-bold text-dark">
                                    Informasi Sewa
                                </Text>
                                {sewaRows.map((row) => (
                                    <InfoRow key={row.label} label={row.label} value={row.value} />
                                ))}
                            </View>
                        ) : null}
                    </>
                ) : null}

                <PasswordChangeSection onFieldFocus={scrollToPasswordForm} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
