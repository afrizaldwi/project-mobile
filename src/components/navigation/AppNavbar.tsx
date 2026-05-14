import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppNavbarProps = {
    onOpenMenu: () => void;
};

export function AppNavbar({ onOpenMenu }: AppNavbarProps) {
    return (
        <SafeAreaView>
            <View className="flex-row items-center justify-between bg-primary px-5 py-4">
                <Text className="text-lg font-extrabold text-white">Kost Bahagia</Text>

                <Pressable
                    onPress={onOpenMenu}
                    className="rounded-lg bg-accent px-3 py-2 active:opacity-80"
                >
                    <Text className="text-2xl font-bold leading-6 text-white">☰</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}