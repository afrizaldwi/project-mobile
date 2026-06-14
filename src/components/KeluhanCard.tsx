import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";

import { normalizeStorageUrl } from "@/utils/storageUrl";
import { Keluhan } from "@/types";

interface KeluhanCardProps {
    keluhan: Keluhan;
    isAdmin?: boolean;
    onDelete?: (id: number) => void;
    onUpdateStatus?: (id: number, status: "pending" | "proses" | "selesai") => void;
}

export function KeluhanCard({ keluhan, isAdmin = false, onDelete, onUpdateStatus }: KeluhanCardProps) {
    const [isViewerVisible, setIsViewerVisible] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);
    const [modalActiveIndex, setModalActiveIndex] = useState(0);

    // Grid item detail modal visibility
    const [isDetailVisible, setIsDetailVisible] = useState(false);

    // Parse image URLs
    let imageUrls: string[] = [];
    if (keluhan.foto_kerusakan) {
        const paths = keluhan.foto_kerusakan.split(",");
        imageUrls = paths
            .map((path) => normalizeStorageUrl(path.trim()))
            .filter((url): url is string => Boolean(url));
    }

    const statusBadgeColors = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        proses: "bg-blue-100 text-blue-700 border-blue-200",
        selesai: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };

    const statusText = {
        pending: "Pending",
        proses: "Proses",
        selesai: "Selesai",
    };

    const statusIcons = {
        pending: "time-outline",
        proses: "construct-outline",
        selesai: "checkmark-circle-outline",
    } as const;

    const noImageBg = {
        pending: "bg-amber-50/70",
        proses: "bg-blue-50/70",
        selesai: "bg-emerald-50/70",
    };

    const noImageIconColor = {
        pending: "#d97706",
        proses: "#2563eb",
        selesai: "#059669",
    };

    const handleDelete = () => {
        Alert.alert(
            "Konfirmasi Hapus",
            "Apakah Anda yakin ingin menghapus keluhan ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: () => {
                        setIsDetailVisible(false);
                        onDelete?.(keluhan.id_keluhan);
                    }
                },
            ]
        );
    };

    const handleUpdateStatus = () => {
        Alert.alert(
            "Update Status",
            "Pilih status terbaru untuk keluhan ini:",
            [
                {
                    text: "Pending",
                    onPress: () => {
                        onUpdateStatus?.(keluhan.id_keluhan, "pending");
                        setIsDetailVisible(false);
                    }
                },
                {
                    text: "Proses",
                    onPress: () => {
                        onUpdateStatus?.(keluhan.id_keluhan, "proses");
                        setIsDetailVisible(false);
                    }
                },
                {
                    text: "Selesai",
                    onPress: () => {
                        onUpdateStatus?.(keluhan.id_keluhan, "selesai");
                        setIsDetailVisible(false);
                    }
                },
                { text: "Batal", style: "cancel" },
            ]
        );
    };

    return (
        <View className="flex-1 m-1.5">
            <Pressable
                onPress={() => {
                    setModalActiveIndex(0);
                    setIsDetailVisible(true);
                }}
                className="h-44 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm elevation-sm active:opacity-90"
            >
                {/* Visual Cover */}
                {imageUrls.length > 0 ? (
                    <View className="flex-1">
                        <Image
                            source={{ uri: imageUrls[0] }}
                            className="h-full w-full"
                            resizeMode="cover"
                        />
                        {/* Multi-photo badge if more than 1 image */}
                        {imageUrls.length > 1 && (
                            <View className="absolute top-2 left-2 flex-row items-center rounded-lg bg-black/60 px-2 py-1">
                                <Ionicons name="images" size={12} color="white" />
                                <Text className="text-[10px] font-extrabold text-white ml-1">+{imageUrls.length - 1}</Text>
                            </View>
                        )}
                        {/* Dark gradient overlay for typography readability */}
                        <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/90 via-black/45 to-transparent justify-end p-3">
                            <Text className="text-xs font-bold text-white" numberOfLines={1}>
                                {keluhan.judul_keluhan}
                            </Text>
                            <Text className="text-[9px] text-white/70 mt-0.5">
                                {new Date(keluhan.tanggal_lapor).toLocaleDateString("id-ID")}
                            </Text>
                        </View>
                    </View>
                ) : (
                    /* No image: Premium visual design with watermark and themed colors */
                    <View className={`flex-1 ${noImageBg[keluhan.status_keluhan] || "bg-gray-50"} justify-between p-3 relative overflow-hidden`}>
                        <View className="absolute -right-8 -bottom-8 opacity-15">
                            <Ionicons
                                name={statusIcons[keluhan.status_keluhan] || "document-text-outline"}
                                size={120}
                                color={noImageIconColor[keluhan.status_keluhan] || "#6b7280"}
                            />
                        </View>

                        <View className="flex-row items-center">
                            <Ionicons
                                name={statusIcons[keluhan.status_keluhan] || "document-text-outline"}
                                size={18}
                                color={noImageIconColor[keluhan.status_keluhan] || "#6b7280"}
                            />
                        </View>

                        <View className="z-10">
                            <Text
                                className="text-xs font-extrabold leading-tight"
                                style={{ color: noImageIconColor[keluhan.status_keluhan] || "#374151" }}
                                numberOfLines={2}
                            >
                                {keluhan.judul_keluhan}
                            </Text>
                            <Text className="text-[9px] text-gray-500 mt-1">
                                {new Date(keluhan.tanggal_lapor).toLocaleDateString("id-ID")}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Status Badge overlay top right */}
                <View className="absolute top-2 right-2 z-20">
                    <View className={`rounded-full px-2 py-0.5 border ${statusBadgeColors[keluhan.status_keluhan] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        <Text className="text-[9px] font-bold capitalize">
                            {statusText[keluhan.status_keluhan]}
                        </Text>
                    </View>
                </View>
            </Pressable>

            {/* A Gorgeous Detailed Modal Viewer */}
            <Modal
                visible={isDetailVisible}
                animationType="slide"
                onRequestClose={() => setIsDetailVisible(false)}
            >
                <View className="flex-1 bg-secondary">
                    {/* Header Image/Banner */}
                    {imageUrls.length > 0 ? (
                        <View className="relative h-72 w-full bg-gray-100">
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={(e) => {
                                    const slideSize = e.nativeEvent.layoutMeasurement.width;
                                    const offset = e.nativeEvent.contentOffset.x;
                                    if (slideSize > 0) {
                                        setModalActiveIndex(Math.round(offset / slideSize));
                                    }
                                }}
                                scrollEventThrottle={16}
                                className="h-full w-full"
                            >
                                {imageUrls.map((url, idx) => (
                                    <Pressable
                                        key={idx}
                                        onPress={() => {
                                            setViewerStartIndex(idx);
                                            setIsViewerVisible(true);
                                        }}
                                        style={{ width: Dimensions.get("window").width, height: 288 }}
                                    >
                                        <Image
                                            source={{ uri: url }}
                                            style={{ width: "100%", height: "100%" }}
                                            resizeMode="cover"
                                        />
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {/* Horizontal Pagination Indicator Dots */}
                            {imageUrls.length > 1 && (
                                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-1.5 z-20">
                                    {imageUrls.map((_, idx) => (
                                        <View
                                            key={idx}
                                            className={`h-2 rounded-full ${
                                                idx === modalActiveIndex ? "w-5 bg-white" : "w-2 bg-white/50"
                                            }`}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Sticky floating back button */}
                            <SafeAreaView className="absolute top-4 left-4 z-30">
                                <Pressable
                                    onPress={() => setIsDetailVisible(false)}
                                    className="h-10 w-10 items-center justify-center rounded-full bg-black/40 shadow-sm"
                                >
                                    <Ionicons name="arrow-back" size={24} color="white" />
                                </Pressable>
                            </SafeAreaView>

                            <View className="absolute top-4 right-4 z-30">
                                <View className={`rounded-full px-3 py-1 border bg-white/90 ${statusBadgeColors[keluhan.status_keluhan]}`}>
                                    <Text className="text-xs font-bold capitalize">
                                        {statusText[keluhan.status_keluhan]}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        /* No Image: Beautiful styled banner with matching status color and large icon watermark */
                        <View className={`relative h-48 w-full ${noImageBg[keluhan.status_keluhan]} justify-end p-6 overflow-hidden`}>
                            <View className="absolute -right-8 -top-8 opacity-15">
                                <Ionicons
                                    name={statusIcons[keluhan.status_keluhan] || "document-text-outline"}
                                    size={160}
                                    color={noImageIconColor[keluhan.status_keluhan] || "#6b7280"}
                                />
                            </View>

                            <SafeAreaView className="absolute top-4 left-4 z-30">
                                <Pressable
                                    onPress={() => setIsDetailVisible(false)}
                                    className="h-10 w-10 items-center justify-center rounded-full bg-black/25"
                                >
                                    <Ionicons name="arrow-back" size={24} color="white" />
                                </Pressable>
                            </SafeAreaView>

                            <View className="absolute top-4 right-4 z-30">
                                <View className={`rounded-full px-3 py-1 border bg-white/95 ${statusBadgeColors[keluhan.status_keluhan]}`}>
                                    <Text className="text-xs font-bold capitalize">
                                        {statusText[keluhan.status_keluhan]}
                                    </Text>
                                </View>
                            </View>

                            <Text
                                className="text-2xl font-extrabold z-10"
                                style={{ color: noImageIconColor[keluhan.status_keluhan] || "#1f2937" }}
                            >
                                {keluhan.judul_keluhan}
                            </Text>
                        </View>
                    )}

                    {/* Scrollable Content */}
                    <ScrollView className="flex-1 px-6 pt-6">
                        {imageUrls.length > 0 && (
                            <Text className="mb-2 text-2xl font-extrabold text-dark">{keluhan.judul_keluhan}</Text>
                        )}

                        <View className="mb-6 flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                <Text className="text-sm text-gray-500 ml-1.5">
                                    Dilaporkan pada: {new Date(keluhan.tanggal_lapor).toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </Text>
                            </View>
                        </View>

                        {/* Submitter Details card for Admin */}
                        {isAdmin && (
                            <View className="mb-6 rounded-xl bg-blue-50/70 border border-blue-100 p-4">
                                <Text className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Informasi Pelapor</Text>
                                <View className="flex-row items-center justify-between mt-1">
                                    <View>
                                        <Text className="text-base font-bold text-dark">{keluhan.nama_penghuni}</Text>
                                        <Text className="text-sm text-gray-600">Penyewa Kamar {keluhan.nomor_kamar}</Text>
                                    </View>
                                    <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center">
                                        <Ionicons name="person" size={20} color="#2563eb" />
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Kerusakan</Text>
                        <View className="mb-10 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                            <Text className="text-base text-gray-800 leading-relaxed font-medium">
                                {keluhan.deskripsi_keluhan}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Bottom Sticky Action Buttons */}
                    {(onUpdateStatus || onDelete) && (
                        <SafeAreaView className="bg-white border-t border-gray-100 p-4 flex-row justify-end space-x-3">
                            {onUpdateStatus && (
                                <Pressable
                                    onPress={handleUpdateStatus}
                                    className="flex-1 flex-row items-center justify-center rounded-xl bg-primary py-3.5 shadow-sm active:opacity-90"
                                >
                                    <Ionicons name="create-outline" size={18} color="white" />
                                    <Text className="ml-2 text-base font-bold text-white">Update Status</Text>
                                </Pressable>
                            )}
                            {onDelete && (
                                <Pressable
                                    onPress={handleDelete}
                                    className="flex-row items-center justify-center rounded-xl bg-red-50 border border-red-200 px-5 py-3.5 active:opacity-90"
                                >
                                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                    <Text className="ml-2 text-base font-bold text-danger">Hapus</Text>
                                </Pressable>
                            )}
                        </SafeAreaView>
                    )}
                </View>
            </Modal>

            {/* Fullscreen Interactive Zoom Image Viewer Modal */}
            <Modal
                visible={isViewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewerVisible(false)}
            >
                <View className="flex-1 bg-black/95 justify-center items-center">
                    <SafeAreaView className="absolute top-4 right-4 z-50">
                        <Pressable
                            onPress={() => setIsViewerVisible(false)}
                            className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </Pressable>
                    </SafeAreaView>

                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentOffset={{ x: viewerStartIndex * Dimensions.get("window").width, y: 0 }}
                        onScroll={(e) => {
                            const slideSize = e.nativeEvent.layoutMeasurement.width;
                            const offset = e.nativeEvent.contentOffset.x;
                            if (slideSize > 0) {
                                setModalActiveIndex(Math.round(offset / slideSize));
                            }
                        }}
                        scrollEventThrottle={16}
                        className="w-full h-full"
                    >
                        {imageUrls.map((url, idx) => (
                            <View
                                key={idx}
                                style={{ width: Dimensions.get("window").width, height: Dimensions.get("window").height }}
                                className="justify-center items-center"
                            >
                                <Image
                                    source={{ uri: url }}
                                    style={{ width: "100%", height: "80%" }}
                                    resizeMode="contain"
                                />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Full screen modal swiper indicator */}
                    {imageUrls.length > 1 && (
                        <View className="absolute bottom-12 left-0 right-0 flex-row justify-center space-x-2">
                            {imageUrls.map((_, idx) => (
                                <View
                                    key={idx}
                                    className={`h-2 rounded-full ${
                                        idx === modalActiveIndex ? "w-6 bg-white" : "w-2 bg-white/30"
                                    }`}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}
