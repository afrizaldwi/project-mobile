import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { useAuth } from "@/auth/AuthContext";
import { ListLoadingView } from "@/components/common/ListLoadingView";
import { hasSeenWelcome } from "@/storage/welcomePreference";

export default function IndexScreen() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [hasCheckedWelcome, setHasCheckedWelcome] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (isLoading) {
      setHasCheckedWelcome(false);
      return () => {
        isActive = false;
      };
    }

    if (isAuthenticated) {
      setWelcomeSeen(true);
      setHasCheckedWelcome(true);
      return () => {
        isActive = false;
      };
    }

    void (async () => {
      try {
        const seen = await hasSeenWelcome();
        if (!isActive) return;
        setWelcomeSeen(seen);
      } finally {
        if (isActive) {
          setHasCheckedWelcome(true);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading || (!isAuthenticated && !hasCheckedWelcome)) {
    return (
      <View className="flex-1 bg-secondary">
        <ListLoadingView />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (!welcomeSeen) {
      return <Redirect href="/welcome" />;
    }

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
