export interface NotificationStrategy {
  send(notif: any): Promise<void>;
}

export class PushNotificationStrategy implements NotificationStrategy {
  async send(notif: any) {
    try {
      const Notifications = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notif.judul || "Notifikasi Tagihan",
          body: notif.pesan || "Ada informasi tagihan yang perlu diperiksa.",
          data: { notificationId: notif.id, tagihanId: notif.id_tagihan },
        },
        trigger: null,
      });
    } catch (error) {
      console.warn("[PushNotificationStrategy] Gagal menampilkan notifikasi:", error);
    }
  }
}
