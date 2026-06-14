import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { NotifikasiItem } from "@/types/tagihan";

interface AdminNotificationModalProps {
  visible: boolean;
  notifications: NotifikasiItem[];
  handleMarkAsRead: (id: number) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  onClose: () => void;
}

export const AdminNotificationModal: React.FC<AdminNotificationModalProps> = ({
  visible,
  notifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
            🔔 Notifikasi Tagihan
          </Text>
          <Text style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            Ada {notifications.length} notifikasi tagihan baru.
          </Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {notifications.map((notif) => (
              <View
                key={notif.id}
                style={{
                  backgroundColor: "#fffbeb",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: "#f59e0b",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#92400e", fontSize: 13 }}>
                  {notif.judul}
                </Text>
                <Text style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>
                  {notif.pesan}
                </Text>
                <TouchableOpacity
                  onPress={() => handleMarkAsRead(notif.id)}
                  style={{ alignSelf: "flex-end", marginTop: 6 }}
                >
                  <Text style={{ fontSize: 12, color: "#d97706", fontWeight: "700" }}>
                    Tandai Dibaca
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{
              backgroundColor: "#f59e0b",
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Tandai Semua Dibaca</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ alignItems: "center", marginTop: 12 }}>
            <Text style={{ color: "#999", fontWeight: "700" }}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
