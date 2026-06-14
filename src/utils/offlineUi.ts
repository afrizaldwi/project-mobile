import { Alert } from "react-native";

import { getConnectivityStatus } from "@/network/connectivity";

export const OFFLINE_ACTION_TITLE = "Koneksi Diperlukan";
export const OFFLINE_ACTION_MESSAGE =
    "Tindakan ini membutuhkan koneksi internet.";

export async function requireOnlineAction(): Promise<boolean> {
    if ((await getConnectivityStatus()) === "offline") {
        Alert.alert(OFFLINE_ACTION_TITLE, OFFLINE_ACTION_MESSAGE);
        return false;
    }

    return true;
}
