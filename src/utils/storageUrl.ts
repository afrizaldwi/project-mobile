import { API_BASE_URL } from "@/constants/env";

const apiOrigin = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return API_BASE_URL.replace(/\/api\/?$/, "");
    }
})();

export function normalizeStorageUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    const value = path.trim();
    if (!value) return null;

    if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
            const url = new URL(value);
            if (url.pathname.startsWith("/storage/")) {
                return `${apiOrigin}${url.pathname}${url.search}`;
            }
            return value;
        } catch {
            return value;
        }
    }

    const normalizedPath = value.startsWith("/storage/")
        ? value
        : `/storage/${value.replace(/^\/+/, "")}`;

    return `${apiOrigin}${normalizedPath}`;
}
