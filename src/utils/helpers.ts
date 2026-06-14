export function getErrorMessage(error: unknown, fallback: string): string {
    return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) || fallback;
}

export function getHttpStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } }).response?.status;
}

export function isFresh(value: string | null, freshnessMs: number): boolean {
    const timestamp = value ? Date.parse(value) : Number.NaN;
    return Number.isFinite(timestamp) && Date.now() - timestamp < freshnessMs;
}
