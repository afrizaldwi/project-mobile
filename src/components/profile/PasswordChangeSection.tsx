import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useChangePassword } from "@/hooks/useChangePassword";

type PasswordChangeSectionProps = {
    onFieldFocus?: () => void;
};

const passwordLabels = {
    current_password: "Password saat ini",
    password: "Password baru",
    password_confirmation: "Konfirmasi password baru",
} as const;

export function PasswordChangeSection({ onFieldFocus }: PasswordChangeSectionProps) {
    const {
        currentPassword,
        newPassword,
        newPasswordConfirmation,
        setCurrentPassword,
        setNewPassword,
        setNewPasswordConfirmation,
        fieldErrors,
        isSubmitting,
        isOffline,
        message,
        status,
        submitChangePassword,
    } = useChangePassword();

    return (
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
            {status === "error" && message ? (
                <View className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <Text className="text-sm font-semibold text-primary">{message}</Text>
                </View>
            ) : null}

            {(Object.keys(passwordLabels) as (keyof typeof passwordLabels)[]).map((field) => {
                const value =
                    field === "current_password"
                        ? currentPassword
                        : field === "password"
                            ? newPassword
                            : newPasswordConfirmation;
                const onChange =
                    field === "current_password"
                        ? setCurrentPassword
                        : field === "password"
                            ? setNewPassword
                            : setNewPasswordConfirmation;

                return (
                    <View key={field} className="mt-4">
                        <Text className="mb-2 text-xs font-bold uppercase text-gray-500">
                            {passwordLabels[field]}
                        </Text>
                        <TextInput
                            onFocus={onFieldFocus}
                            value={value}
                            onChangeText={onChange}
                            secureTextEntry
                            editable={!isSubmitting}
                            className={`rounded-lg border px-4 py-3 text-dark ${fieldErrors[field] ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                                }`}
                        />
                        {fieldErrors[field] ? (
                            <Text className="mt-1 text-xs font-semibold text-red-600">
                                {fieldErrors[field]}
                            </Text>
                        ) : null}
                    </View>
                );
            })}

            <TouchableOpacity
                onPress={submitChangePassword}
                disabled={isSubmitting}
                className={`mt-5 rounded-lg px-4 py-3 ${isSubmitting ? "bg-gray-300" : "bg-primary"}`}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text className="text-center text-sm font-bold text-white">Ubah Password</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
