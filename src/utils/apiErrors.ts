import { isAxiosError } from "axios";

export function isRecoverableApiAvailabilityError(error: unknown): boolean {
    if (!isAxiosError(error)) return false;

    const code = error.code?.toUpperCase();
    const status = error.response?.status;

    if (!error.response) return true;
    if (code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ETIMEDOUT")
        return true;
    if (status === 408 || status === 429) return true;
    return typeof status === "number" && status >= 500;
}

export function getSafeErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        if (typeof error.response?.status === "number") {
            return `HTTP ${error.response.status}`;
        }
        return error.code || error.message || "Axios error";
    }

    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
}
