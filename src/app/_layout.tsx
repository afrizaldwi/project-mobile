import { AuthProvider } from "@/auth/AuthContext";
import { registerBackgroundFetchAsync } from "@/utils/backgroundTask";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";

export default function RootLayout() {
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status === "granted") {
        registerBackgroundFetchAsync();
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}