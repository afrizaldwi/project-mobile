import * as SplashScreen from "expo-splash-screen";

const SPLASH_SAFETY_TIMEOUT_MS = 5000;

let splashHidden = false;
let hidePromise: Promise<void> | null = null;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const safetyTimer =
    typeof setTimeout === "function"
        ? setTimeout(() => {
              void hideNativeSplash("safety-timeout");
          }, SPLASH_SAFETY_TIMEOUT_MS)
        : null;

export function hasNativeSplashBeenHidden() {
    return splashHidden;
}

export async function hideNativeSplash(_reason?: string): Promise<void> {
    if (splashHidden) return;
    if (!hidePromise) {
        hidePromise = SplashScreen.hideAsync()
            .catch(() => undefined)
            .finally(() => {
                splashHidden = true;
                if (safetyTimer) clearTimeout(safetyTimer);
            });
    }
    await hidePromise;
}
