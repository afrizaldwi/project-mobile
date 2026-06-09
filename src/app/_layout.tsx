import { AuthProvider } from "@/auth/AuthContext";
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
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
