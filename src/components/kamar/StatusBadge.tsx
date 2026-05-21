import { Text, View } from "react-native";
import { getStatusBadge } from "@/api/kamarService";
import type { Kamar } from "@/types/kamar";

type StatusBadgeProps = {
    status: Kamar["status_kamar"];
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const badge = getStatusBadge(status);
    return (
        <View
            style={{ backgroundColor: badge.bgColor }}
            className="rounded-full px-2 py-0.5"
        >
            <Text style={{ color: badge.textColor }} className="text-[10px] font-bold">
                {badge.label}
            </Text>
        </View>
    );
}
