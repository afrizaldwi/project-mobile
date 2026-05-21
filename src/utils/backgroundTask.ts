import { tagihanApi } from '@/api/tagihanApi';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { NotificationFacade } from '@/services/NotificationFacade';

const BACKGROUND_FETCH_TASK = 'BACKGROUND-CHECK-NOTIFIKASI';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Cukup panggil gerbang utama (Facade)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Facade menyembunyikan kerumitan di balik satu fungsi ini
    await NotificationFacade.checkAndNotify(); 
    return BackgroundFetch.BackgroundFetchResult.NewData;
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