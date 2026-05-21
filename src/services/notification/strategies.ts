import * as Linking from "expo-linking";

import { isExpoGo } from "@/utils/isExpoGo";

export interface NotificationStrategy {
  send(notif: any): Promise<void>;
}

export class PushNotificationStrategy implements NotificationStrategy {
  async send(notif: any) {
    if (isExpoGo) return;

    try {
      const Notifications = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: { title: notif.judul || "Info", body: notif.pesan },
        trigger: null,
      });
    } catch (error) {
      console.warn("[PushNotificationStrategy] Gagal menampilkan notifikasi:", error);
    }
  }
}

export class WhatsAppNotificationStrategy implements NotificationStrategy {
  async send(notif: any) {
    const whatsapp = notif.tagihan?.whatsapp;
    if (whatsapp?.enabled && whatsapp.url) {
      try {
        await Linking.openURL(whatsapp.url);
      } catch (error) {
        console.warn(
          "[WhatsApp Strategy] Gagal membuka WhatsApp (mungkin berjalan di latar belakang):",
          error
        );
      }
    }
  }
}
