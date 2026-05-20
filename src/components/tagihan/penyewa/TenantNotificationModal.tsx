import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NotifikasiItem } from "@/api/tagihanApi";

interface TenantNotificationModalProps {
  visible: boolean;
  notifications: NotifikasiItem[];
  handleMarkAsRead: (id: number) => void;
  handleMarkAllAsRead: () => void;
  onClose: () => void;
}

export const TenantNotificationModal: React.FC<TenantNotificationModalProps> = ({
  visible,
  notifications,
  handleMarkAsRead,
  handleMarkAllAsRead,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "80%" }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#1a1a1a", marginBottom: 4 }}>
            🔔 Notifikasi Tagihan
          </Text>
          <Text style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            Kamu punya {notifications.length} notifikasi tagihan.
          </Text>

          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {notifications.map((notif) => (
              <View
                key={notif.id}
                style={{
                  backgroundColor: "#fffbeb",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#fde68a",
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
                  style={{ marginTop: 8, alignSelf: "flex-end" }}
                >
                  <Text style={{ fontSize: 12, color: "#d97706", fontWeight: "700" }}>
                    Tandai Dibaca
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={{
                backgroundColor: "#f59e0b",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Tandai Semua Dibaca</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{ alignItems: "center", marginTop: 12 }}
          >
            <Text style={{ color: "#999", fontWeight: "700" }}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
