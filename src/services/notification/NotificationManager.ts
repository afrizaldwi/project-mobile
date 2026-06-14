import type { NotifikasiItem } from "@/types/tagihan";

import type { NotificationStrategy } from "./strategies";

export class NotificationManager {
  private observers: NotificationStrategy[] = [];

  subscribe(strategy: NotificationStrategy): void {
    this.observers.push(strategy);
  }

  async notify(notifications: readonly NotifikasiItem[]): Promise<void> {
    for (const notification of notifications) {
      for (const observer of this.observers) {
        await observer.send(notification);
      }
    }
  }
}
