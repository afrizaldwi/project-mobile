import "@/utils/nativeSplash";
import { AuthProvider } from "@/auth/AuthContext";
import { AppStartupBootstrap } from "@/components/bootstrap/AppStartupBootstrap";
import { DatabaseProvider } from "@/database/DatabaseProvider";
import { setupNotificationsAndBackgroundFetch } from "@/utils/backgroundTask";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";

export default function RootLayout() {
  useEffect(() => {
    void setupNotificationsAndBackgroundFetch();
  }, []);

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AuthProvider>
          <AppStartupBootstrap />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
