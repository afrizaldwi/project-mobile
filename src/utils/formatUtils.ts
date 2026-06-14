/**
 * Shared format utility functions untuk fitur Data Penghuni & Laporan Keuangan.
 * Dipusatkan di sini agar tidak ada fungsi format yang tersebar di dalam hook.
 */

/**
 * Format angka ke format mata uang Rupiah Indonesia.
 * Contoh: 1500000 → "Rp 1.500.000"
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format objek Date ke string tanggal lokal format "YYYY-MM-DD".
 * Contoh: new Date("2025-06-14") → "2025-06-14"
 */
export function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Format string tanggal ISO ke tampilan lokal Indonesia.
 * Contoh: "2025-06-14" → "14 Juni 2025"
 */
export function formatDisplayDate(
    value: string | null | undefined,
    fallback = "-",
): string {
    if (!value) return fallback;
    return new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
