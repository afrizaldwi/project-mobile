type ApiErrorResponse = {
    response?: {
        data?: {
            message?: unknown;
        };
    };
};

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
