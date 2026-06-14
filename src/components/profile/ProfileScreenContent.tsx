import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { getErrorMessage as getApiErrorMessage } from "@/utils/apiErrors";
import { profileService } from "@/api/profileService";
import { useAuth } from "@/auth/AuthContext";
import { deleteCachedUser, deleteToken } from "@/auth/tokenStorage";
import { useProfile } from "@/hooks/useProfile";
import { getConnectivityStatus } from "@/network/connectivity";
import type { UserRole } from "@/types";
import type {
    PasswordChangePayload,
} from "@/types/profile";

type PasswordField = "current_password" | "password" | "password_confirmation";

type PasswordForm = PasswordChangePayload;

type PasswordErrors = Partial<Record<PasswordField, string>>;

type ValidationErrorResponse = {
    message?: string;
    errors?: Partial<Record<PasswordField, string[]>>;
};

type ProfileScreenContentProps = {
    role: UserRole;
    title: string;
    subtitle: string;
};

const initialPasswordForm: PasswordForm = {
    current_password: "",
    password: "",
    password_confirmation: "",
};

const passwordLabels: Record<PasswordField, string> = {
    current_password: "Password saat ini",
    password: "Password baru",
    password_confirmation: "Konfirmasi password baru",
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

function getFieldError(error: unknown): PasswordErrors {
    const data = (error as { response?: { data?: ValidationErrorResponse } })?.response?.data;
    const validationErrors = data?.errors;
    if (!validationErrors) return {};

    return Object.fromEntries(
        Object.entries(validationErrors).map(([field, messages]) => [
            field,
            messages?.[0] || "Kolom ini tidak valid.",
        ])
    ) as PasswordErrors;
}

const getErrorMessage = getApiErrorMessage;

function InfoRow({ label, value }: { label: string; value: unknown }) {
    return (
        <View className="border-b border-gray-100 py-3 last:border-b-0">
            <Text className="text-xs font-bold uppercase text-gray-400">{label}</Text>
            <Text className="mt-1 text-base font-semibold text-dark">{valueOrDash(value)}</Text>
        </View>
    );
}

export function ProfileScreenContent({ role, title, subtitle }: ProfileScreenContentProps) {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const {
        profile,
        loading,
        refreshing,
        notice,
        error,
        isPartial,
        isOffline,
        refresh,
    } = useProfile(role);
    const [passwordForm, setPasswordForm] = useState<PasswordForm>(initialPasswordForm);
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

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

        return rows.filter(
            (row) => !isPartial || row.value !== null,
        );
    }, [isPartial, profile, role]);

    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

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

    const updatePasswordField = (field: PasswordField, value: string) => {
        setPasswordForm((current) => ({ ...current, [field]: value }));
        setPasswordErrors((current) => ({ ...current, [field]: undefined }));
        setPasswordMessage(null);
    };

    const handlePasswordSubmit = async () => {
        try {
            setIsSubmittingPassword(true);
            setPasswordErrors({});
            setPasswordMessage(null);

            if ((await getConnectivityStatus()) === "offline") {
                Alert.alert(
                    "Koneksi Diperlukan",
                    "Tindakan ini membutuhkan koneksi internet.",
                );
                return;
            }

            const response = await profileService.changePassword(passwordForm);
            const message =
                response.message || "Password berhasil diubah. Silakan masuk kembali.";

            setPasswordForm(initialPasswordForm);
            setPasswordMessage(message);
            await deleteToken();
            await deleteCachedUser();
            await refreshUser();

            Alert.alert("Password Berhasil Diubah", message, [
                { text: "OK", onPress: () => router.replace("/login") },
            ]);
        } catch (error) {
            const fieldErrors = getFieldError(error);
            if (Object.keys(fieldErrors).length > 0) {
                setPasswordErrors(fieldErrors);
            } else {
                setPasswordMessage(getErrorMessage(error, "Gagal mengubah password."));
            }
        } finally {
            setIsSubmittingPassword(false);
        }
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
                    <View className="mt-6 rounded-xl bg-white p-6 items-center">
                        <ActivityIndicator color="#2563eb" />
                        <Text className="mt-3 text-sm font-semibold text-gray-500">Memuat profil...</Text>
                    </View>
                ) : error && !profile ? (
                    <View className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
                        <Text className="text-sm font-semibold text-red-700">{error}</Text>
                        <TouchableOpacity onPress={refresh} className="mt-3 rounded-lg bg-red-600 px-4 py-3">
                            <Text className="text-center text-sm font-bold text-white">Coba Lagi</Text>
                        </TouchableOpacity>
                    </View>
                ) : profile ? (
                    <>
                        {notice ? (
                            <View className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <Text className="text-sm font-semibold text-primary">{notice}</Text>
                            </View>
                        ) : null}
                        {error ? (
                            <View className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
                                <Text className="text-sm font-semibold text-red-700">{error}</Text>
                            </View>
                        ) : null}
                        <View className="mt-6 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                            <Text className="mb-2 text-lg font-bold text-dark">Informasi Akun</Text>
                            <InfoRow label="Nama Lengkap" value={profile.nama_lengkap} />
                            <InfoRow label="Email" value={profile.email} />
                            <InfoRow label="Role" value={roleLabel(profile.role)} />
                            <InfoRow label="Nomor HP" value={profile.no_hp} />
                        </View>

                        {sewaRows.length > 0 ? (
                            <View className="mt-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                                <Text className="mb-2 text-lg font-bold text-dark">Informasi Sewa</Text>
                                {sewaRows.map((row) => (
                                    <InfoRow key={row.label} label={row.label} value={row.value} />
                                ))}
                            </View>
                        ) : null}
                    </>
                ) : null}

                <View className="mt-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                    <Text className="text-lg font-bold text-dark">Ubah Password</Text>
                    <Text className="mt-1 text-sm text-gray-500">
                        Setelah berhasil, kamu perlu login ulang.
                    </Text>
                    {isOffline ? (
                        <Text className="mt-2 text-sm font-semibold text-gray-500">
                            Perubahan password memerlukan koneksi internet.
                        </Text>
                    ) : null}

                    {(Object.keys(passwordLabels) as PasswordField[]).map((field) => (
                        <View key={field} className="mt-4">
                            <Text className="mb-2 text-xs font-bold uppercase text-gray-500">
                                {passwordLabels[field]}
                            </Text>
                            <TextInput
                                onFocus={scrollToPasswordForm}
                                value={passwordForm[field]}
                                onChangeText={(value) => updatePasswordField(field, value)}
                                secureTextEntry
                                editable={!isSubmittingPassword}
                                className={`rounded-lg border px-4 py-3 text-dark ${passwordErrors[field] ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                                    }`}
                            />
                            {passwordErrors[field] ? (
                                <Text className="mt-1 text-xs font-semibold text-red-600">{passwordErrors[field]}</Text>
                            ) : null}
                        </View>
                    ))}

                    {passwordMessage ? (
                        <View className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                            <Text className="text-sm font-semibold text-primary">{passwordMessage}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        onPress={handlePasswordSubmit}
                        disabled={isSubmittingPassword}
                        className={`mt-5 rounded-lg px-4 py-3 ${isSubmittingPassword ? "bg-gray-300" : "bg-primary"}`}
                    >
                        {isSubmittingPassword ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-center text-sm font-bold text-white">Ubah Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>

    );
}
