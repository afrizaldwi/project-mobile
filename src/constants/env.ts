const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

console.log("EXPO_PUBLIC_API_BASE_URL:", apiBaseUrl);

if (!apiBaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in .env");
}

export const API_BASE_URL = apiBaseUrl;