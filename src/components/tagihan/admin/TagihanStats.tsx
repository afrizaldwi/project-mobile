import React from "react";
import { Text, View } from "react-native";

interface TagihanStatsProps {
  stats: {
    total: number;
    lunas: number;
    belum: number;
    pending: number;
  };
}

export const TagihanStats: React.FC<TagihanStatsProps> = ({ stats }) => {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
      {[
        { label: "Total", value: stats.total, color: "#3b82f6", bg: "#eff6ff" },
        { label: "Lunas", value: stats.lunas, color: "#16a34a", bg: "#f0fdf4" },
        { label: "Belum", value: stats.belum, color: "#dc2626", bg: "#fef2f2" },
        { label: "Pending", value: stats.pending, color: "#d97706", bg: "#fffbeb" },
      ].map((s) => (
        <View
          key={s.label}
          style={{
            flex: 1,
            backgroundColor: s.bg,
            borderRadius: 14,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "900", color: s.color }}>
            {s.value}
          </Text>
          <Text style={{ fontSize: 10, color: s.color, fontWeight: "700" }}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
};
