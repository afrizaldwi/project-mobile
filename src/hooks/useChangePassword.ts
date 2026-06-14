import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { profileService } from "@/api/profileService";
import { useAuth } from "@/auth/AuthContext";
import { getConnectivityStatus } from "@/network/connectivity";
import { getApiErrorMessage } from "@/utils/apiErrors";

type ChangePasswordField = "current_password" | "password" | "password_confirmation";

type ChangePasswordFieldErrors = Partial<Record<ChangePasswordField, string>>;

type SubmitStatus = "idle" | "success" | "error";

type UseChangePasswordResult = {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirmation: string;
    setCurrentPassword: (value: string) => void;
    setNewPassword: (value: string) => void;
    setNewPasswordConfirmation: (value: string) => void;
    fieldErrors: ChangePasswordFieldErrors;
    isSubmitting: boolean;
    isOffline: boolean;
    message: string | null;
    status: SubmitStatus;
    submitChangePassword: () => Promise<void>;
};

const SUCCESS_MESSAGE = "Password berhasil diubah. Silakan masuk kembali.";
const OFFLINE_MESSAGE = "Tindakan ini membutuhkan koneksi internet.";
const GENERIC_ERROR_MESSAGE = "Gagal mengubah password.";

function getFieldError(error: unknown): ChangePasswordFieldErrors {
    const data = (error as {
        response?: {
            data?: {
                errors?: Partial<Record<ChangePasswordField, string[]>>;
            };
        };
    })?.response?.data;
    const validationErrors = data?.errors;
    if (!validationErrors) return {};

    return Object.fromEntries(
        Object.entries(validationErrors).map(([field, messages]) => [
            field,
            messages?.[0] || "Kolom ini tidak valid.",
        ]),
    ) as ChangePasswordFieldErrors;
}

export function useChangePassword(): UseChangePasswordResult {
    const router = useRouter();
    const { logout } = useAuth();
    const [currentPassword, setCurrentPasswordState] = useState("");
    const [newPassword, setNewPasswordState] = useState("");
    const [newPasswordConfirmation, setNewPasswordConfirmationState] = useState("");
    const [fieldErrors, setFieldErrors] = useState<ChangePasswordFieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<SubmitStatus>("idle");

    useEffect(() => {
        void getConnectivityStatus().then((currentStatus) => {
            setIsOffline(currentStatus === "offline");
        });
    }, []);

    const clearMessage = useCallback(() => {
        setMessage(null);
        setStatus("idle");
    }, []);

    const setCurrentPassword = useCallback(
        (value: string) => {
            setCurrentPasswordState(value);
            setFieldErrors((current) => ({ ...current, current_password: undefined }));
            clearMessage();
        },
        [clearMessage],
    );

    const setNewPassword = useCallback(
        (value: string) => {
            setNewPasswordState(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
            clearMessage();
        },
        [clearMessage],
    );

    const setNewPasswordConfirmation = useCallback(
        (value: string) => {
            setNewPasswordConfirmationState(value);
            setFieldErrors((current) => ({ ...current, password_confirmation: undefined }));
            clearMessage();
        },
        [clearMessage],
    );

    const submitChangePassword = useCallback(async () => {
        setIsSubmitting(true);
        setFieldErrors({});
        clearMessage();

        try {
            if ((await getConnectivityStatus()) === "offline") {
                setIsOffline(true);
                setMessage(OFFLINE_MESSAGE);
                setStatus("error");
                Alert.alert("Koneksi Diperlukan", OFFLINE_MESSAGE);
                return;
            }
            setIsOffline(false);

            const response = await profileService.changePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPasswordConfirmation,
            });

            const successMessage = response.message || SUCCESS_MESSAGE;
            setCurrentPasswordState("");
            setNewPasswordState("");
            setNewPasswordConfirmationState("");
            setMessage(successMessage);
            setStatus("success");

            await logout();

            Alert.alert("Password Berhasil Diubah", successMessage, [
                { text: "OK", onPress: () => router.replace("/login") },
            ]);
        } catch (error) {
            const fieldErrorsResponse = getFieldError(error);
            if (Object.keys(fieldErrorsResponse).length > 0) {
                setFieldErrors(fieldErrorsResponse);
                setStatus("error");
                return;
            }

            const errorMessage = getApiErrorMessage(error, GENERIC_ERROR_MESSAGE);
            setMessage(errorMessage);
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        clearMessage,
        currentPassword,
        logout,
        newPassword,
        newPasswordConfirmation,
        router,
    ]);

    return {
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
    };
}
