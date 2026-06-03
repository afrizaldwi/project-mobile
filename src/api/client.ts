import { create, type InternalAxiosRequestConfig } from "axios";

import { deleteToken, getToken } from "@/auth/tokenStorage";
import { API_BASE_URL } from "@/constants/env";

type MultipartFieldDebug = {
    field: string;
    isFile: boolean;
    hasUri?: boolean;
    hasName?: boolean;
    hasType?: boolean;
};

type AuthSessionInactiveHandler = (message: string) => void | Promise<void>;

let authSessionInactiveHandler: AuthSessionInactiveHandler | null = null;

export function setAuthSessionInactiveHandler(handler: AuthSessionInactiveHandler | null) {
    authSessionInactiveHandler = handler;
}

function isFormDataPayload(data: unknown): data is FormData {
    if (!data || typeof data !== "object") return false;

    const candidate = data as { append?: unknown; _parts?: unknown };
    return (
        (typeof FormData !== "undefined" && data instanceof FormData) ||
        (typeof candidate.append === "function" && Array.isArray(candidate._parts))
    );
}

function setMultipartContentType(headers: InternalAxiosRequestConfig["headers"]) {
    const value = "multipart/form-data";
    const mutableHeaders = headers as any;

    if (typeof mutableHeaders.setContentType === "function") {
        mutableHeaders.setContentType(value);
        return;
    }

    if (typeof mutableHeaders.set === "function") {
        mutableHeaders.set("Content-Type", value);
        return;
    }

    mutableHeaders["Content-Type"] = value;
}

function getMultipartDebugFields(data: unknown): MultipartFieldDebug[] {
    const parts = (data as { _parts?: unknown })._parts;
    if (!Array.isArray(parts)) return [];

    return parts.map((part) => {
        const [field, value] = Array.isArray(part) ? part : [String(part), undefined];
        const isFile = Boolean(
            value &&
            typeof value === "object" &&
            "uri" in value
        );
        const file = value as { uri?: unknown; name?: unknown; type?: unknown } | undefined;

        return {
            field: String(field),
            isFile,
            ...(isFile
                ? {
                    hasUri: Boolean(file?.uri),
                    hasName: Boolean(file?.name),
                    hasType: Boolean(file?.type),
                }
                : {}),
        };
    });
}

function logMultipartError(error: unknown) {
    if (typeof __DEV__ === "undefined" || !__DEV__) return;

    const config = (error as { config?: InternalAxiosRequestConfig }).config;
    if (!config || !isFormDataPayload(config.data)) return;

    console.log("[api multipart error]", {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL ?? ""}${config.url ?? ""}`,
        isFormData: true,
        fields: getMultipartDebugFields(config.data),
    });
}

function getRequestUrl(config?: InternalAxiosRequestConfig) {
    return String(config?.url ?? "");
}

function isPenyewaProtectedRequest(url: string) {
    return url.startsWith("/penyewa") || url.includes("/penyewa/");
}

function isProfileInactiveSewaError(url: string, message: string) {
    if (!url.startsWith("/profile")) return false;

    const normalized = message.toLowerCase();
    return (
        normalized.includes("sewa") ||
        normalized.includes("penyewa") ||
        normalized.includes("tidak aktif") ||
        normalized.includes("nonaktif")
    );
}

function shouldEndCurrentSession(error: unknown) {
    const candidate = error as {
        config?: InternalAxiosRequestConfig;
        response?: { status?: number; data?: { message?: string } };
    };
    const status = candidate.response?.status;
    const url = getRequestUrl(candidate.config);
    const message = candidate.response?.data?.message ?? "";

    if (status === 401) return true;
    if (status !== 403) return false;

    return isPenyewaProtectedRequest(url) || isProfileInactiveSewaError(url, message);
}

async function endCurrentSession(message = "Sesi Anda sudah tidak aktif. Silakan login kembali.") {
    await deleteToken();
    await authSessionInactiveHandler?.(message);
}

// Penerapan Factory Pattern untuk HTTP Client
export const createApiClient = (baseURL: string = API_BASE_URL) => {
    const client = create({
        baseURL,
        timeout: 30000,
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
    });

    client.interceptors.request.use(async (config) => {
        if (isFormDataPayload(config.data) && config.headers) {
            setMultipartContentType(config.headers);
        }

        const token = await getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        async (error) => {
            logMultipartError(error);

            if (shouldEndCurrentSession(error)) {
                await endCurrentSession();
            }

            return Promise.reject(error);
        }
    );

    return client;
};

// Membuat instance default agar logika dan import di file lain tidak perlu diubah
export const apiClient = createApiClient();
