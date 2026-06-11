import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { ListEmptyView } from "@/components/common/ListEmptyView";
import { ListLoadingView } from "@/components/common/ListLoadingView";
import { TamuCard } from "@/components/TamuCard";
import type { AdminTamuItem } from "@/types/tamu";

interface AdminTamuListProps {
    loading: boolean;
    refreshing: boolean;
    loadingMore: boolean;
    error: string | null;
    tamus: AdminTamuItem[];
    onRefresh: () => void;
    onLoadMore: () => void;
    onRetry: () => void;
    onDelete: (id: number) => void;
}

export function AdminTamuList({
    loading,
    refreshing,
    loadingMore,
    error,
    tamus,
    onRefresh,
    onLoadMore,
    onRetry,
    onDelete,
}: AdminTamuListProps) {
    if (loading) {
        return <ListLoadingView />;
    }

    return (
        <FlatList
            data={tamus}
            keyExtractor={(item) => item.id_tamu.toString()}
            contentContainerClassName="px-6 pb-24 pt-2"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={() => {
                if (tamus.length > 0) onLoadMore();
            }}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => (
                <TamuCard tamu={item} isAdmin={true} onDelete={onDelete} />
            )}
            ListEmptyComponent={
                error ? (
                    <View className="items-center py-10">
                        <Text className="text-center text-sm font-semibold text-red-600">{error}</Text>
                        <Pressable onPress={onRetry} className="mt-3 rounded-xl bg-primary px-4 py-2.5">
                            <Text className="text-sm font-bold text-white">Muat Ulang</Text>
                        </Pressable>
                    </View>
                ) : (
                    <ListEmptyView icon="people-outline" message="Belum ada data tamu tercatat." />
                )
            }
            ListHeaderComponent={
                error && tamus.length > 0 ? (
                    <Pressable onPress={onRetry} className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3">
                        <Text className="text-center text-xs font-semibold text-red-700">{error}</Text>
                    </Pressable>
                ) : null
            }
            ListFooterComponent={
                loadingMore ? (
                    <View className="items-center py-5">
                        <ActivityIndicator size="small" color="#2563eb" />
                    </View>
                ) : null
            }
        />
    );
}
