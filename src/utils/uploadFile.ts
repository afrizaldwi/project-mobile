import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type UploadFilePayload = {
    uri: string;
    name: string;
    type: string;
};

type PickerFileAsset = {
    uri: string;
    fileName?: string | null;
    name?: string | null;
    mimeType?: string | null;
};

const mimeByExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
};

function getExtension(value?: string | null): string {
    const clean = value?.split("?")[0]?.split("#")[0] ?? "";
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1]?.toLowerCase() || "jpg";
}

export function fileAssetToUploadFile(
    asset: PickerFileAsset,
    fallbackBaseName = "upload"
): UploadFilePayload {
    const extension = getExtension(asset.fileName || asset.name || asset.uri);
    const type = asset.mimeType || mimeByExtension[extension] || "image/jpeg";
    const rawName = asset.fileName || asset.name || fallbackBaseName + "." + extension;
    const name = /\.[a-zA-Z0-9]+$/.test(rawName) ? rawName : rawName + "." + extension;

    return {
        uri: Platform.OS === "android" ? asset.uri : asset.uri.replace("file://", ""),
        name,
        type,
    };
}

export function imageAssetToUploadFile(
    asset: ImagePicker.ImagePickerAsset,
    fallbackBaseName = "upload"
): UploadFilePayload {
    return fileAssetToUploadFile(asset, fallbackBaseName);
}
