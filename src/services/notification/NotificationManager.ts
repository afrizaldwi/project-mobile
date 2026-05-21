import { NotificationStrategy } from './strategies';

export class NotificationManager {
  private observers: NotificationStrategy[] = [];

  subscribe(strategy: NotificationStrategy) {
    this.observers.push(strategy);
  }

  async notify(data: any[]) {
    for (const notif of data) {
      for (const observer of this.observers) {
        await observer.send(notif);
      }
    }
  }
}