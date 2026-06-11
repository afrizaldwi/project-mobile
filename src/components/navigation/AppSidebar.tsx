import { router, usePathname } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/auth/AuthContext";
import {
  adminNavigation,
  penyewaNavigation,
  type NavigationItem,
} from "@/constants/navigation";

type AppSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (!isOpen) {
    return null;
  }

  const menu: NavigationItem[] =
    user?.role === "admin" ? adminNavigation : penyewaNavigation;

  function handleNavigate(path: string) {
    onClose();
    router.push(path as never);
  }

  async function handleLogout() {
    onClose();
    await logout();
    router.replace("/login");
  }

  return (
    <View
      className="absolute inset-0 z-50 bg-black/40"
      style={{ elevation: 50 }}
    >
      <View
        className="h-full w-full bg-primary"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          elevation: 51,
        }}
      >
        <View className="flex-row items-center justify-between border-b border-accent px-6 py-5">
          <View>
            <Text className="text-xl font-extrabold text-white">
              Basecamp Kost
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            className="rounded-lg bg-accent px-3 py-2 active:opacity-80"
          >
            <Text className="text-xl font-bold text-white">×</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <View className="gap-2">
            {menu.map((item) => {
              const isActive = pathname === item.path;

              return (
                <Pressable
                  key={item.path}
                  onPress={() => handleNavigate(item.path)}
                  className={`rounded-xl px-4 py-3 ${
                    isActive ? "bg-white" : "bg-transparent active:bg-accent"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isActive ? "text-primary" : "text-white"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="border-t border-accent px-4 py-4">
          <Pressable
            onPress={handleLogout}
            className="items-center rounded-xl bg-accent py-4 active:opacity-80"
          >
            <Text className="font-bold text-white">Logout</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
