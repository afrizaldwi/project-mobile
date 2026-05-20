import React from "react";
import { FlatList, RefreshControl } from "react-native";

import { ListEmptyView } from "@/components/common/ListEmptyView";
import { ListLoadingView } from "@/components/common/ListLoadingView";
import { TamuCard } from "@/components/TamuCard";
import { Tamu } from "@/types";

interface AdminTamuListProps {
    loading: boolean;
    refreshing: boolean;
    tamus: Tamu[];
    onRefresh: () => void;
    onDelete: (id: number) => void;
}

export function AdminTamuList({
    loading,
    refreshing,
    tamus,
    onRefresh,
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
            renderItem={({ item }) => (
                <TamuCard tamu={item} isAdmin={true} onDelete={onDelete} />
            )}
            ListEmptyComponent={
                <ListEmptyView
                    icon="people-outline"
                    message="Belum ada data tamu tercatat."
                />
            }
        />
    );
}
