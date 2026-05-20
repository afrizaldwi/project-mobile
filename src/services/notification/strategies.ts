import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

export interface NotificationStrategy {
  send(notif: any): Promise<void>;
}

export class PushNotificationStrategy implements NotificationStrategy {
  async send(notif: any) {
    await Notifications.scheduleNotificationAsync({
      content: { title: notif.judul || 'Info', body: notif.pesan },
      trigger: null,
    });
  }
}

export class WhatsAppNotificationStrategy implements NotificationStrategy {
  async send(notif: any) {
    const whatsapp = notif.tagihan?.whatsapp;
    if (whatsapp && whatsapp.enabled && whatsapp.url) {
      try {
        await Linking.openURL(whatsapp.url);
      } catch (error) {
        console.warn('[WhatsApp Strategy] Gagal membuka WhatsApp (mungkin berjalan di latar belakang):', error);
      }
    } else {
      console.log(`[WhatsApp Strategy] Pengiriman WA dilewati karena data nomor/pesan tidak tersedia.`);
    }
  }
}