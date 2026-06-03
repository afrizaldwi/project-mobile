// src/services/NotificationFacade.ts
import { tagihanApi } from "@/api/tagihanApi";
import { NotificationManager } from "./notification/NotificationManager";
import { PushNotificationStrategy } from "./notification/strategies";

const notifiedNotificationKeys = new Set<string>();

function getNotificationKey(notifId: number, userId?: number | string | null) {
  return `${userId ?? "anonymous"}:${notifId}`;
}

export class NotificationFacade {
  static resetNotifiedNotifications() {
    notifiedNotificationKeys.clear();
  }

  static async checkAndNotifyForUser(userId?: number | string | null) {
    await this.checkAndNotify(userId);
  }

  // Hanya mengecek data notifikasi dari database, lalu menyebarkan ke Observer/Strategy terdaftar
  static async checkAndNotify(userId?: number | string | null) {
    const dataNotif = await tagihanApi.getNotifications(true);
    if (!dataNotif || dataNotif.length === 0) return;

    const pendingNotifications = dataNotif.filter((notif) => {
      const notificationKey = getNotificationKey(notif.id, userId);
      if (notifiedNotificationKeys.has(notificationKey)) return false;
      notifiedNotificationKeys.add(notificationKey);
      return true;
    });
    if (pendingNotifications.length === 0) return;

    const manager = new NotificationManager();
    manager.subscribe(new PushNotificationStrategy());

    await manager.notify(pendingNotifications);
  }

  // Melakukan Pengecekan Jatuh Tempo (H-7 otomatis) di backend, baru menampilkan notifikasi lokal (Facade Utama)
  static async runCheckAndNotify(userId?: number | string | null) {
    // 1. Jalankan kalkulasi H-7 & buat record notifikasi di server
    await tagihanApi.runDueDateCheck();
    // 2. Ambil notifikasi terbuat, lalu tampilkan sebagai notifikasi lokal
    await this.checkAndNotify(userId);
  }
}
