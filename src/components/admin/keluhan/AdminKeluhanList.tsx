import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { ListEmptyView } from "@/components/common/ListEmptyView";
import { ListLoadingView } from "@/components/common/ListLoadingView";
import { KeluhanCard } from "@/components/KeluhanCard";
import { Keluhan } from "@/types";

interface AdminKeluhanListProps {
    loading: boolean;
    refreshing: boolean;
    loadingMore: boolean;
    error: string | null;
    notice?: string | null;
    keluhans: Keluhan[];
    onRefresh: () => void;
    onLoadMore: () => void;
    onRetry: () => void;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, status: "pending" | "proses" | "selesai") => void;
}

export function AdminKeluhanList({
    loading,
    refreshing,
    loadingMore,
    error,
    notice,
    keluhans,
    onRefresh,
    onLoadMore,
    onRetry,
    onDelete,
    onUpdateStatus,
}: AdminKeluhanListProps) {
    if (loading) {
        return <ListLoadingView />;
    }

    return (
        <FlatList
            data={keluhans}
            keyExtractor={(item) => item.id_keluhan.toString()}
            contentContainerClassName="px-4 pb-6 pt-4"
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onEndReached={() => {
                if (keluhans.length > 0) onLoadMore();
            }}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => (
                <KeluhanCard
                    keluhan={item}
                    isAdmin={true}
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                />
            )}
            ListEmptyComponent={
                error ? (
                    <View className="items-center py-10">
                        <Text className="text-center text-sm font-semibold text-red-600">{error}</Text>
                        <Pressable
                            onPress={onRetry}
                            className="mt-3 rounded-xl bg-primary px-4 py-2.5 active:opacity-80"
                        >
                            <Text className="text-sm font-bold text-white">Muat Ulang</Text>
                        </Pressable>
                    </View>
                ) : (
                    <ListEmptyView
                        icon="document-text-outline"
                        message="Tidak ada keluhan ditemukan untuk status ini."
                    />
                )
            }
            ListHeaderComponent={
                notice ? (
                    <View className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                        <Text className="text-center text-xs font-semibold text-yellow-700">{notice}</Text>
                    </View>
                ) : error && keluhans.length > 0 ? (
                    <Pressable
                        onPress={onRetry}
                        className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3 active:opacity-80"
                    >
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
