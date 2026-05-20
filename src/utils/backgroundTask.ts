import { tagihanApi } from '@/api/tagihanApi';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'BACKGROUND-CHECK-NOTIFIKASI';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const dataNotif = await tagihanApi.getNotifications(true);

    if (dataNotif && dataNotif.length > 0) {
      for (const notif of dataNotif) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notif.judul || 'Info Kost',
            body: notif.pesan || 'Ada tagihan baru.',
          },
          trigger: null,
        });
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}