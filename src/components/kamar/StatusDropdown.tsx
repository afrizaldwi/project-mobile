import type { KamarStatus } from "@/types/kamar";
import { useRef, useState } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";

type FilterStatus = "semua" | KamarStatus;

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
    { label: "Semua Status", value: "semua" },
    { label: "Tersedia", value: "tersedia" },
    { label: "Terisi", value: "terisi" },
    { label: "Perbaikan", value: "perbaikan" },
];

const MENU_HEIGHT = 148;
const SCREEN_MARGIN = 8;

type StatusDropdownProps = {
    selected: FilterStatus;
    onSelect: (val: FilterStatus) => void;
};

export function StatusDropdown({ selected, onSelect }: StatusDropdownProps) {
    const [open, setOpen] = useState(false);
    const [menuLayout, setMenuLayout] = useState({ left: 0, top: 0, width: 0 });
    const triggerRef = useRef<View>(null);
    const selectedLabel =
        FILTER_OPTIONS.find((o) => o.value === selected)?.label ?? "Semua Status";

    const closeDropdown = () => setOpen(false);

    const openDropdown = () => {
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            const window = Dimensions.get("window");
            const menuWidth = Math.min(width, window.width - SCREEN_MARGIN * 2);
            const left = Math.min(Math.max(SCREEN_MARGIN, x), window.width - menuWidth - SCREEN_MARGIN);
            const belowTop = y + height + 4;
            const top = belowTop + MENU_HEIGHT <= window.height - SCREEN_MARGIN
                ? belowTop
                : Math.max(SCREEN_MARGIN, y - MENU_HEIGHT - 4);

            setMenuLayout({ left, top, width: menuWidth });
            setOpen(true);
        });
    };

    return (
        <View ref={triggerRef} collapsable={false}>
            <Pressable
                onPress={() => (open ? closeDropdown() : openDropdown())}
                className="flex-row items-center gap-1 rounded-xl bg-white px-3 active:opacity-80"
                style={{ elevation: 1, height: 44 }}
            >
                <Text className="text-xs font-semibold text-dark">{selectedLabel}</Text>
                <Text className="text-[10px] text-gray-400">{open ? "▲" : "▼"}</Text>
            </Pressable>

            <Modal transparent visible={open} animationType="none" onRequestClose={closeDropdown}>
                <Pressable className="absolute inset-0" onPress={closeDropdown} />
                <View
                    className="absolute overflow-hidden rounded-xl bg-white"
                    style={{ elevation: 10, left: menuLayout.left, top: menuLayout.top, width: menuLayout.width }}
                >
                    {FILTER_OPTIONS.map((opt, i) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => {
                                onSelect(opt.value);
                                closeDropdown();
                            }}
                            className={`px-4 py-2.5 active:opacity-70 ${selected === opt.value ? "bg-secondary" : "bg-white"
                                } ${i !== FILTER_OPTIONS.length - 1 ? "border-b border-gray-100" : ""}`}
                        >
                            <Text
                                className={`text-xs font-semibold ${selected === opt.value ? "text-primary" : "text-dark"
                                    }`}
                            >
                                {opt.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Modal>
        </View>
    );
}

export type { FilterStatus };
