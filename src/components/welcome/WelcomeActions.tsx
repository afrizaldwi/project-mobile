import { ActivityIndicator, Pressable, Text, View } from "react-native";

type WelcomeActionsProps = {
    isSubmitting: boolean;
    showContactAction: boolean;
    onPressMasuk: () => void;
    onPressContact: () => void;
};

export function WelcomeActions({
    isSubmitting,
    showContactAction,
    onPressMasuk,
    onPressContact,
}: WelcomeActionsProps) {
    return (
        <View className="w-full px-6">
            <Pressable
                onPress={onPressMasuk}
                disabled={isSubmitting}
                className={`items-center rounded-xl bg-primary py-4 active:bg-accent ${isSubmitting ? "opacity-70" : ""}`}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text className="text-base font-bold text-white">Masuk</Text>
                )}
            </Pressable>

            {showContactAction ? (
                <Pressable
                    onPress={onPressContact}
                    className="mt-5 px-4 py-2"
                    hitSlop={8}
                >
                    <Text className="text-center text-sm font-medium leading-6 text-primary">
                        Belum memiliki akses atau mengalami masalah? Hubungi
                        Pengelola
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}
