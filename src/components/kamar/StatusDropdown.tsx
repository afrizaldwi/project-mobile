import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { KamarStatus } from "@/types/kamar";

type FilterStatus = "semua" | KamarStatus;

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
    { label: "Semua Status", value: "semua" },
    { label: "Tersedia", value: "tersedia" },
    { label: "Terisi", value: "terisi" },
];

type StatusDropdownProps = {
    selected: FilterStatus;
    onSelect: (val: FilterStatus) => void;
};

export function StatusDropdown({ selected, onSelect }: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const selectedLabel =
        FILTER_OPTIONS.find((o) => o.value === selected)?.label ?? "Semua Status";

    return (
        <View style={{ position: "relative", zIndex: 10 }}>
            <Pressable
                onPress={() => setOpen((v) => !v)}
                className="flex-row items-center gap-1 rounded-xl bg-white px-3 active:opacity-80"
                style={{ elevation: 1, height: 44 }}
            >
                <Text className="text-xs font-semibold text-dark">{selectedLabel}</Text>
                <Text className="text-[10px] text-gray-400">{open ? "▲" : "▼"}</Text>
            </Pressable>

            {open && (
                <View
                    className="absolute right-0 top-12 overflow-hidden rounded-xl bg-white"
                    style={{ elevation: 10, minWidth: 130, zIndex: 999 }}
                >
                    {FILTER_OPTIONS.map((opt, i) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => {
                                onSelect(opt.value);
                                setOpen(false);
                            }}
                            className={`px-4 py-2.5 active:opacity-70 ${
                                selected === opt.value ? "bg-secondary" : "bg-white"
                            } ${i !== FILTER_OPTIONS.length - 1 ? "border-b border-gray-100" : ""}`}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    selected === opt.value ? "text-primary" : "text-dark"
                                }`}
                            >
                                {opt.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

export type { FilterStatus };
