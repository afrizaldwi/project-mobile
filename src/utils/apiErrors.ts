import { isAxiosError } from "axios";

type ApiErrorResponse = {
    response?: {
        data?: {
            message?: unknown;
        };
    };
};

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

export function getErrorMessage(error: unknown, fallback: string): string {
    return (
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        fallback
    );
}

export function getHttpStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } }).response?.status;
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

export function getApiErrorMessage(error: unknown, fallback: string): string {
    const message = (error as ApiErrorResponse)?.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
        return message;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}
