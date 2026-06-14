import * as SecureStore from "expo-secure-store";

const WELCOME_SEEN_KEY = "welcome_seen_v1";

export async function hasSeenWelcome(): Promise<boolean> {
    try {
        return (await SecureStore.getItemAsync(WELCOME_SEEN_KEY)) === "true";
    } catch {
        return false;
    }
}

export async function markWelcomeAsSeen(): Promise<void> {
    await SecureStore.setItemAsync(WELCOME_SEEN_KEY, "true");
}
