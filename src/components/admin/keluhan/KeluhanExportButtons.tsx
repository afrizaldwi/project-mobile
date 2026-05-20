import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface KeluhanExportButtonsProps {
    onExport: (format: "csv" | "json") => void;
    exporting: "csv" | "json" | null;
}

export function KeluhanExportButtons({ onExport, exporting }: KeluhanExportButtonsProps) {
    const isBusy = exporting !== null;

    return (
        <View className="flex-row">
            <Pressable
                onPress={() => onExport("csv")}
                disabled={isBusy}
                className={`mr-2 rounded-lg bg-green-600 px-3 py-2 ${isBusy ? "opacity-60" : ""}`}
            >
                {exporting === "csv" ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="text-xs font-bold text-white">CSV</Text>
                )}
            </Pressable>
            <Pressable
                onPress={() => onExport("json")}
                disabled={isBusy}
                className={`rounded-lg bg-blue-600 px-3 py-2 ${isBusy ? "opacity-60" : ""}`}
            >
                {exporting === "json" ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text className="text-xs font-bold text-white">JSON</Text>
                )}
            </Pressable>
        </View>
    );
}
