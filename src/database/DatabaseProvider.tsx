import { SQLiteProvider } from "expo-sqlite";
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";

import { APP_DATABASE_NAME, initializeDatabase } from "@/database/database";

type DatabaseProviderProps = {
    children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
    const [error, setError] = useState<Error | null>(null);

    if (error) {
        return (
            <View className="flex-1 items-center justify-center bg-secondary px-6">
                <Text className="text-center text-base font-bold text-red-600">
                    Database lokal gagal disiapkan.
                </Text>
                <Text className="mt-2 text-center text-xs text-gray-500">{error.message}</Text>
            </View>
        );
    }

    return (
        <SQLiteProvider databaseName={APP_DATABASE_NAME} onInit={initializeDatabase} onError={setError}>
            {children}
        </SQLiteProvider>
    );
}
