import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";

interface FloatingAddButtonProps {
    onPress: () => void;
}

export function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
    return (
        <Pressable
            onPress={onPress}
            className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg elevation-xl"
        >
            <Ionicons name="add" size={32} color="#ffffff" />
        </Pressable>
    );
}
