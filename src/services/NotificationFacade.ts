// src/services/NotificationFacade.ts
import { tagihanApi } from '@/api/tagihanApi';
import { NotificationManager } from './notification/NotificationManager';
import { PushNotificationStrategy, WhatsAppNotificationStrategy } from './notification/strategies';

export class NotificationFacade {
  // Hanya mengecek data notifikasi dari database, lalu menyebarkan ke Observer/Strategy terdaftar
  static async checkAndNotify() {
    const dataNotif = await tagihanApi.getNotifications(true);
    if (!dataNotif || dataNotif.length === 0) return;

    const manager = new NotificationManager();
    manager.subscribe(new PushNotificationStrategy());
    manager.subscribe(new WhatsAppNotificationStrategy());
    
    await manager.notify(dataNotif);
  }

  // Melakukan Pengecekan Jatuh Tempo (H-7 otomatis) di backend, baru mendistribusikan notifikasi (Facade Utama)
  static async runCheckAndNotify() {
    // 1. Jalankan kalkulasi H-7 & buat record notifikasi di server
    await tagihanApi.runDueDateCheck();
    // 2. Ambil notifikasi terbuat, lalu sebar ke semua media (Push & WhatsApp)
    await this.checkAndNotify();
  }
}