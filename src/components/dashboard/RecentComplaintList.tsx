import { Text, View } from "react-native";

import type { DashboardKeluhanItem } from "@/types/dashboard";

type RecentComplaintListProps = {
    items: readonly DashboardKeluhanItem[];
    emptyMessage: string;
};

export function RecentComplaintList({
    items,
    emptyMessage,
}: RecentComplaintListProps) {
    if (items.length === 0) {
        return (
            <Text className="text-sm font-medium text-dark/40">
                {emptyMessage}
            </Text>
        );
    }

    return items.map((item, index) => (
        <View
            key={`${item.judul}-${index}`}
            className="mb-3 rounded-2xl bg-light p-4"
        >
            <Text className="font-black text-dark">{item.judul}</Text>

            <Text className="mt-1 text-xs font-semibold uppercase text-primary">
                {item.status}
            </Text>

            <Text className="mt-1 text-xs font-medium text-dark/40">
                {item.tanggal}
            </Text>
        </View>
    ));
}