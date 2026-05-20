import React from "react";
import { Text, TextInput, View } from "react-native";

interface FormTextFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: "default" | "phone-pad";
    multiline?: boolean;
    numberOfLines?: number;
}

export function FormTextField({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false,
    numberOfLines,
}: FormTextFieldProps) {
    const marginClass = multiline ? "mb-6" : "mb-4";

    return (
        <View className={marginClass}>
            <Text className="mb-2 text-sm font-bold text-gray-700">{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={numberOfLines}
                textAlignVertical={multiline ? "top" : "auto"}
                className={`rounded-xl border border-gray-200 bg-white p-4 text-base text-dark ${
                    multiline ? "min-h-[100px]" : ""
                }`}
                placeholderTextColor="#9ca3af"
            />
        </View>
    );
}
