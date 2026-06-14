export const DASHBOARD_KELUHAN_STATUSES = [
    "pending",
    "proses",
    "selesai",
] as const;

export const DASHBOARD_KAMAR_STATUSES = [
    "tersedia",
    "terisi",
    "perbaikan",
] as const;

export const DASHBOARD_TAGIHAN_STATUSES = [
    "belum_bayar",
    "lunas",
    "telat",
    "dibatalkan",
] as const;

export type DashboardKeluhanStatus =
    (typeof DASHBOARD_KELUHAN_STATUSES)[number];

export type DashboardKamarStatus =
    (typeof DASHBOARD_KAMAR_STATUSES)[number];

export type DashboardTagihanStatus =
    (typeof DASHBOARD_TAGIHAN_STATUSES)[number];

export type DashboardKeluhanItem = {
    judul: string;
    status: DashboardKeluhanStatus;
    tanggal: string;
};

export type AdminDashboardResponse = {
    cards: {
        total_kamar: number;
        penghuni_aktif: number;
        tagihan_belum_dibayar: number;
        pendapatan_bulan_ini: number;
        keluhan_pending: number;
    };
    charts: {
        status_kamar: {
            tersedia: number;
            terisi: number;
            perbaikan: number;
        };
        status_tagihan: {
            belum_bayar: number;
            lunas: number;
            telat: number;
        };
        status_keluhan: {
            pending: number;
            proses: number;
            selesai: number;
        };
    };
    recent_keluhan: DashboardKeluhanItem[];
};

export type AdminDashboardSummary = AdminDashboardResponse;

export type PenyewaDashboardCards = {
    kamar_saya: string;
    tagihan_aktif: number;
    status_pembayaran: DashboardTagihanStatus | "-";
    sisa_masa_sewa: string;
    keluhan_saya: number;
};

export type PenyewaDashboardKamarResponse = {
    nomor_kamar: string | null;
    fasilitas: string | null;
    harga_bulanan: string | null;
    status_kamar: DashboardKamarStatus | null;
};

export type PenyewaDashboardKamar = Omit<
    PenyewaDashboardKamarResponse,
    "harga_bulanan"
> & {
    harga_bulanan: number | null;
};

export type PenyewaDashboardTagihanResponse = {
    kode_invoice: string;
    tanggal_jatuh_tempo: string;
    total_tagihan: string;
    status_tagihan: DashboardTagihanStatus;
};

export type PenyewaDashboardTagihan = Omit<
    PenyewaDashboardTagihanResponse,
    "total_tagihan"
> & {
    total_tagihan: number;
};

export type PenyewaDashboardKontrak = {
    tanggal_masuk: string;
    tanggal_keluar: string | null;
    durasi_sewa_bulan: number;
    status_sewa: "aktif";
    progress_persen: number;
    sisa_masa_sewa: string;
};

export type PenyewaDashboardResponse = {
    cards: PenyewaDashboardCards;
    kamar: PenyewaDashboardKamarResponse | null;
    tagihan_terbaru: PenyewaDashboardTagihanResponse | null;
    kontrak: PenyewaDashboardKontrak | null;
    keluhan_terakhir: DashboardKeluhanItem[];
};

export type PenyewaDashboardSummary = {
    cards: PenyewaDashboardCards;
    kamar: PenyewaDashboardKamar | null;
    tagihan_terbaru: PenyewaDashboardTagihan | null;
    kontrak: PenyewaDashboardKontrak | null;
    keluhan_terakhir: DashboardKeluhanItem[];
};
