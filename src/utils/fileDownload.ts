import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

interface DownloadAndShareParams {
    url: string;
    filename: string;
    headers?: Record<string, string>;
    mimeType: string;
}

export async function downloadAndShareFile({
    url,
    filename,
    headers,
    mimeType,
}: DownloadAndShareParams): Promise<void> {
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    const result = await FileSystem.downloadAsync(url, fileUri, { headers });

    if (result.status < 200 || result.status >= 300) {
        throw new Error(`Unduhan gagal (status ${result.status})`);
    }

    if (Platform.OS === "web") {
        if (typeof document !== "undefined") {
            const anchor = document.createElement("a");
            anchor.href = result.uri;
            anchor.download = filename;
            anchor.click();
        }
        return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        Alert.alert("Sukses", `File tersimpan di perangkat:\n${result.uri}`);
        return;
    }

    await Sharing.shareAsync(result.uri, {
        mimeType,
        dialogTitle: "Simpan laporan",
    });
}
