import { formatHarga, formatTanggal, getImageUrl } from "@/api/kamarService";
import type { Kamar } from "@/types/kamar";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";

type KamarGridCardProps = {
  kamar: Kamar;
  onEdit: () => void;
  onHapus: () => void;
};

export function KamarGridCard({ kamar, onEdit, onHapus }: KamarGridCardProps) {
  const fasilitasList = kamar.fasilitas.split(",").map((f) => f.trim());

  const baseFotoUri = getImageUrl(kamar.foto_kamar);

  const fotoUri =
    baseFotoUri && kamar.updated_at
      ? `${baseFotoUri}${baseFotoUri.includes("?") ? "&" : "?"}v=${encodeURIComponent(
          kamar.updated_at,
        )}`
      : baseFotoUri;

  const [imageError, setImageError] = useState(false);

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl bg-white"
      style={{
        width: "48%",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        zIndex: 1,
      }}
    >
      {fotoUri && !imageError ? (
        <Image
          source={{ uri: fotoUri }}
          className="h-24 w-full"
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View className="h-24 w-full items-center justify-center bg-blue-50">
          <Text className="text-4xl">🛏️</Text>
        </View>
      )}

      <View className="absolute right-2 top-2">
        <StatusBadge status={kamar.status_kamar} />
      </View>

      <View className="p-2.5">
        <Text className="text-sm font-bold text-dark">
          No. {kamar.nomor_kamar}
        </Text>
        <Text className="text-xs font-semibold text-primary">
          {formatHarga(kamar.harga_bulanan)}/bln
        </Text>
        <Text className="mt-0.5 text-[10px] text-gray-500">
          📐 {kamar.luas_kamar}
        </Text>

        <View className="mt-1.5 flex-row flex-wrap gap-1">
          {fasilitasList.slice(0, 3).map((f, i) => (
            <View key={i} className="rounded-full bg-blue-50 px-1.5 py-0.5">
              <Text className="text-[9px] font-medium text-primary">{f}</Text>
            </View>
          ))}
          {fasilitasList.length > 3 && (
            <Text className="text-[9px] text-gray-400">
              +{fasilitasList.length - 3} lainnya
            </Text>
          )}
        </View>

        <Text className="mt-1.5 text-[9px] text-gray-400">
          {formatTanggal(kamar.created_at)}
        </Text>

        <View className="mt-2 flex-row gap-1.5">
          <Pressable
            onPress={onEdit}
            className="flex-1 items-center rounded-lg bg-blue-50 py-1.5 active:opacity-70"
          >
            <Text className="text-[11px] font-semibold text-primary">
              ✏️ Edit
            </Text>
          </Pressable>
          <Pressable
            onPress={onHapus}
            className="flex-1 items-center rounded-lg bg-red-50 py-1.5 active:opacity-70"
          >
            <Text className="text-[11px] font-semibold text-red-600">
              🗑️ Hapus
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
