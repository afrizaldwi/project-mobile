import type { NotifikasiItem } from "@/types/tagihan";

export interface NotificationStrategy {
  send(notification: NotifikasiItem): Promise<void>;
}

export class PushNotificationStrategy implements NotificationStrategy {
  async send(notification: NotifikasiItem): Promise<void> {
    try {
      const Notifications = await import("expo-notifications");

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.judul || "Notifikasi Tagihan",
          body:
            notification.pesan ||
            "Ada informasi tagihan yang perlu diperiksa.",
          data: {
            notificationId: notification.id,
            tagihanId: notification.id_tagihan,
          },
        },
        trigger: null,
      });
    } catch (error) {
      console.warn(
        "[PushNotificationStrategy] Gagal menampilkan notifikasi:",
        error,
      );
    }
  }
}
