import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { useAuth } from "@/auth/AuthContext";

export default function LoginScreen() {
    const router = useRouter();
    const { login, user, isAuthenticated, isLoading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoading || !isAuthenticated || !user) {
            return;
        }

        if (user.role === "admin") {
            router.replace("/admin/dashboard");
            return;
        }

        if (user.role === "penyewa") {
            router.replace("/penyewa/dashboard");
            return;
        }
    }, [isLoading, isAuthenticated, user, router]);

    async function handleLogin() {
        setErrorMessage("");

        if (!email.trim() || !password.trim()) {
            setErrorMessage("Email dan password wajib diisi.");
            return;
        }

        setIsSubmitting(true);

        try {
            const loggedInUser = await login({
                email: email.trim(),
                password,
            });

            if (loggedInUser.role === "admin") {
                router.replace("/admin/dashboard");
                return;
            }

            if (loggedInUser.role === "penyewa") {
                router.replace("/penyewa/dashboard");
                return;
            }

            setErrorMessage("Role pengguna tidak dikenali.");
        } catch (error: any) {
            console.log("LOGIN ERROR MESSAGE:", error?.message);
            console.log("LOGIN ERROR STATUS:", error?.response?.status);
            console.log("LOGIN ERROR DATA:", error?.response?.data);
            console.log("LOGIN ERROR BASE URL:", error?.config?.baseURL);
            console.log("LOGIN ERROR URL:", error?.config?.url);

            const status = error?.response?.status;

            if (status === 401 || status === 422) {
                setErrorMessage("Email atau password salah.");
                return;
            }

            if (status === 500) {
                setErrorMessage("Terjadi kesalahan pada server.");
                return;
            }

            if (error?.message === "Network Error") {
                setErrorMessage("Tidak dapat terhubung ke server.");
                return;
            }

            setErrorMessage("Login gagal. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading || isAuthenticated) {
        return (
            <View className="flex-1 items-center justify-center bg-secondary">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView className="flex-1 bg-secondary">
            <ScrollView
                contentContainerClassName="flex-grow justify-center px-6 py-8"
                keyboardShouldPersistTaps="handled"
            >
                <View className="rounded-2xl bg-white p-6 shadow-lg elevation-lg">
                    <Text className="mb-2 text-center text-4xl font-extrabold text-dark">
                        Login
                    </Text>
                    {errorMessage ? (
                        <View className="mb-4 rounded-xl border border-danger bg-red-100 p-3">
                            <Text className="text-center text-sm text-danger">
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}
                    <View className="mb-4">
                        <Text className="mb-2 text-sm font-semibold text-dark">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Masukkan email"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-dark"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <View className="mb-4">
                        <Text className="mb-2 text-sm font-semibold text-dark">
                            Password
                        </Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                            placeholder="Masukkan password"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-dark"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                    <Pressable
                        onPress={handleLogin}
                        disabled={isSubmitting}
                        className={`mt-2 items-center rounded-xl bg-primary py-4 active:bg-accent ${isSubmitting ? "opacity-70" : ""
                            }`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-base font-bold text-white">Login</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}