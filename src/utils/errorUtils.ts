/**
 * Shared error utility functions untuk fitur Data Penghuni & Laporan Keuangan.
 * Dipusatkan di sini agar tidak ada fungsi duplikat di setiap hook.
 */

/**
 * Mengambil pesan error dari response API atau Error object.
 * Mendukung format Axios response error maupun Error standar.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    const apiMessage = (
        error as { response?: { data?: { message?: string } } }
    )?.response?.data?.message;

    if (apiMessage) return apiMessage;
    if (error instanceof Error) return error.message;
    return fallback;
}

/**
 * Mengambil HTTP status code dari error Axios.
 * Mengembalikan undefined jika bukan HTTP error.
 */
export function getHttpStatusCode(error: unknown): number | undefined {
    return (error as { response?: { status?: number } }).response?.status;
}

/**
 * Mengambil pesan validasi pertama dari error Axios (Laravel validation errors).
 * Mengembalikan null jika tidak ada validation error.
 */
export function getFirstValidationError(error: unknown): string | null {
    const errors = (
        error as { response?: { data?: { errors?: Record<string, string[]> } } }
    )?.response?.data?.errors;

    if (!errors) return null;
    const firstField = Object.values(errors)[0];
    return firstField?.[0] ?? null;
}
