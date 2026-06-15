import { Text, View } from "react-native";

export type DashboardSummaryCard = {
    label: string;
    value: string;
    description: string;
};

type DashboardSummaryGridProps = {
    cards: readonly DashboardSummaryCard[];
    valueWeight?: "bold" | "black";
};

export function DashboardSummaryGrid({
    cards,
    valueWeight = "bold",
}: DashboardSummaryGridProps) {
    const valueClassName =
        valueWeight === "black"
            ? "mt-2 text-xl font-black text-dark"
            : "mt-2 text-xl font-bold text-dark";

    return (
        <View className="flex-row flex-wrap gap-3">
            {cards.map((card) => (
                <View
                    key={card.label}
                    className="min-h-[118px] flex-1 basis-[47%] rounded-2xl border border-gray-100 bg-white p-4"
                >
                    <Text className="text-xs font-bold uppercase text-dark/40">
                        {card.label}
                    </Text>

                    <Text className={valueClassName}>{card.value}</Text>

                    <Text className="mt-1 text-xs font-medium text-dark/40">
                        {card.description}
                    </Text>
                </View>
            ))}
        </View>
    );
}