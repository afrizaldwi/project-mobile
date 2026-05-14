import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/auth/AuthContext";

export default function IndexScreen() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (user?.role === "admin") {
    return <Redirect href="/admin/dashboard" />;
  }

  if (user?.role === "penyewa") {
    return <Redirect href="/penyewa/dashboard" />;
  }

  return <Redirect href="/login" />;
}