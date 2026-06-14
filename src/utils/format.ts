const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
});

export function formatRupiah(angka: string | number): string {
    const nilai = typeof angka === "string" ? Number(angka) : angka;
    if (!Number.isFinite(nilai)) return "-";
    return rupiahFormatter.format(nilai);
}

export function formatTanggalLengkap(tanggal?: string | null): string {
    if (!tanggal || tanggal === "—" || tanggal === "-") return "-";
    const tgl = new Date(tanggal);
    if (Number.isNaN(tgl.getTime())) return "-";
    return tgl.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}
