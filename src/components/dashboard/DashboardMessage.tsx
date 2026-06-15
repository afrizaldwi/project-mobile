import { Text, View } from "react-native";

type DashboardMessageProps = {
    message?: string | null;
    variant: "error" | "notice";
};

export function DashboardMessage({
    message,
    variant,
}: DashboardMessageProps) {
    if (!message) {
        return null;
    }

    const containerClassName =
        variant === "error"
            ? "mb-4 rounded-2xl border border-danger/20 bg-danger/10 p-4"
            : "mb-4 rounded-2xl border border-primary/20 bg-primary/10 p-4";

    const textClassName =
        variant === "error"
            ? "text-sm font-bold text-danger"
            : "text-sm font-bold text-primary";

    return (
        <View className={containerClassName}>
            <Text className={textClassName}>{message}</Text>
        </View>
    );
}