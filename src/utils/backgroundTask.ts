import { NotificationFacade } from "@/services/NotificationFacade";
import { isExpoGo } from "@/utils/isExpoGo";

const BACKGROUND_FETCH_TASK = "BACKGROUND-CHECK-NOTIFIKASI";

let setupStarted = false;

/**
 * Registers local notifications + background fetch. Skipped in Expo Go because
 * push/background APIs require a development build (SDK 53+).
 */
export async function setupNotificationsAndBackgroundFetch(): Promise<void> {
  if (isExpoGo || setupStarted) return;
  setupStarted = true;

  try {
    const Notifications = await import("expo-notifications");
    const BackgroundFetch = await import("expo-background-fetch");
    const TaskManager = await import("expo-task-manager");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    if (!alreadyRegistered) {
      TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        try {
          await NotificationFacade.checkAndNotify();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch {
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 15,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (error) {
    console.warn("[backgroundTask] Native notifications unavailable:", error);
  }
}

/** @deprecated Use setupNotificationsAndBackgroundFetch */
export const registerBackgroundFetchAsync = setupNotificationsAndBackgroundFetch;
