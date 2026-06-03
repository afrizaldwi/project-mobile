import { NotificationFacade } from "@/services/NotificationFacade";
import { LogBox, Platform } from "react-native";
import { isExpoGo } from "./isExpoGo";

const BACKGROUND_FETCH_TASK = "BACKGROUND-CHECK-NOTIFIKASI";

if (isExpoGo) {
  LogBox.ignoreLogs([
    "expo-notifications: Android Push notifications",
    "`expo-notifications` functionality is not fully supported in Expo Go",
  ]);
}

let setupStarted = false;

function devLog(message: string, details?: Record<string, unknown>) {
  if (__DEV__) {
    console.log("[backgroundTask]", message, details ?? "");
  }
}

/**
 * Registers local notifications + background fetch. In Expo Go, foreground
 * local notification setup still runs while background fetch registration is skipped.
 */
export async function setupNotificationsAndBackgroundFetch(): Promise<void> {
  if (setupStarted) return;
  setupStarted = true;

  try {
    const Notifications = await import("expo-notifications");

    devLog("setup started", { isExpoGo });

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === "android") {
      const channel = await Notifications.getNotificationChannelAsync("default");
      if (!channel) {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Notifikasi",
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
    }

    const { status } = await Notifications.requestPermissionsAsync();
    devLog("permission status", { status });
    if (status !== "granted") return;

    await NotificationFacade.checkAndNotify();
    devLog("foreground notification check ran");

    if (isExpoGo) {
      devLog("background fetch registration skipped", { reason: "Expo Go" });
      return;
    }

    const BackgroundFetch = await import("expo-background-fetch");
    const TaskManager = await import("expo-task-manager");

    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        await NotificationFacade.checkAndNotify();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch {
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK
    );
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 15,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      devLog("background fetch registered");
    } else {
      devLog("background fetch already registered");
    }
  } catch (error) {
    console.warn("[backgroundTask] Native notifications unavailable:", error);
  }
}

/** @deprecated Use setupNotificationsAndBackgroundFetch */
export const registerBackgroundFetchAsync = setupNotificationsAndBackgroundFetch;
