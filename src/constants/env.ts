const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in .env");
}

if (!apiBaseUrl.startsWith("http://") && !apiBaseUrl.startsWith("https://")) {
    throw new Error(
        "EXPO_PUBLIC_API_BASE_URL must start with http:// or https://"
    );
}

export const API_BASE_URL = apiBaseUrl;