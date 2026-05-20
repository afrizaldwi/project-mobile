import React from "react";
import { FlatList, RefreshControl } from "react-native";

import { ListEmptyView } from "@/components/common/ListEmptyView";
import { ListLoadingView } from "@/components/common/ListLoadingView";
import { KeluhanCard } from "@/components/KeluhanCard";
import { Keluhan } from "@/types";

interface AdminKeluhanListProps {
    loading: boolean;
    refreshing: boolean;
    keluhans: Keluhan[];
    onRefresh: () => void;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, status: "pending" | "proses" | "selesai") => void;
}

export function AdminKeluhanList({
    loading,
    refreshing,
    keluhans,
    onRefresh,
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
            renderItem={({ item }) => (
                <KeluhanCard
                    keluhan={item}
                    isAdmin={true}
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                />
            )}
            ListEmptyComponent={
                <ListEmptyView
                    icon="document-text-outline"
                    message="Tidak ada keluhan ditemukan untuk status ini."
                />
            }
        />
    );
}
