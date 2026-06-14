import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import { ListLoadingView } from "@/components/common/ListLoadingView";
import { WelcomeActions } from "@/components/welcome/WelcomeActions";
import { WelcomeHero } from "@/components/welcome/WelcomeHero";
import { markWelcomeAsSeen } from "@/storage/welcomePreference";

const adminContactUrl = process.env.EXPO_PUBLIC_ADMIN_CONTACT_URL?.trim() ?? "";

export default function WelcomeScreen() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-secondary">
                <ListLoadingView />
            </SafeAreaView>
        );
    }

    if (isAuthenticated && user?.role === "admin") {
        return <Redirect href="/admin/dashboard" />;
    }

    if (isAuthenticated && user?.role === "penyewa") {
        return <Redirect href="/penyewa/dashboard" />;
    }

    async function handleMasukPress() {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            await markWelcomeAsSeen();
            router.replace("/login");
        } catch {
            Alert.alert(
                "Gagal Menyimpan Preferensi",
                "Status welcome tidak dapat disimpan. Silakan coba lagi.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleContactPress() {
        try {
            const supported = await Linking.canOpenURL(adminContactUrl);

            if (!supported) {
                Alert.alert(
                    "Tautan Tidak Valid",
                    "Tautan pengelola tidak valid atau tidak didukung pada perangkat ini.",
                );
                return;
            }

            await Linking.openURL(adminContactUrl);
        } catch {
            Alert.alert(
                "Gagal Membuka Tautan",
                "Tautan pengelola tidak dapat dibuka. Silakan coba lagi nanti.",
            );
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-secondary">
            <View className="flex-1 justify-between py-10">
                <View className="flex-1 items-center justify-center">
                    <WelcomeHero />
                </View>

                <WelcomeActions
                    isSubmitting={isSubmitting}
                    showContactAction={adminContactUrl.length > 0}
                    onPressMasuk={handleMasukPress}
                    onPressContact={handleContactPress}
                />
            </View>
        </SafeAreaView>
    );
}
