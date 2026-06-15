import { Pressable, Text, View } from "react-native";

type DashboardHeaderProps = {
    title: string;
    userName?: string | null;
    fallbackName: string;
    onLogout: () => void | Promise<void>;
};

export function DashboardHeader({
    title,
    userName,
    fallbackName,
    onLogout,
}: DashboardHeaderProps) {
    return (
        <View className="mb-5 rounded-3xl bg-primary p-5">
            <Text className="text-xs font-bold uppercase tracking-widest text-white/70">
                {title}
            </Text>

            <Text className="mt-2 text-2xl font-black text-white">
                Halo, {userName || fallbackName}
            </Text>

            <Pressable
                onPress={() => {
                    void onLogout();
                }}
                className="mt-4 self-start rounded-xl bg-white/15 px-4 py-2"
            >
                <Text className="text-sm font-bold text-white">Logout</Text>
            </Pressable>
        </View>
    );
}