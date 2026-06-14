import { useState, type ReactNode } from "react";
import { View } from "react-native";

import { OfflineBanner } from "@/components/common/OfflineBanner";
import { AppNavbar } from "@/components/navigation/AppNavbar";
import { AppSidebar } from "@/components/navigation/AppSidebar";

type AppLayoutProps = {
    children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <View className="flex-1 bg-secondary">
            <AppNavbar onOpenMenu={() => setIsMenuOpen(true)} />

            <OfflineBanner />

            <View className="flex-1">{children}</View>

            <AppSidebar
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </View>
    );
}