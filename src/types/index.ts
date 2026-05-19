export type UserRole = "admin" | "penyewa";

export type User = {
    id: number;
    nama_lengkap: string;
    email: string;
    role: UserRole;
    noHp?: string;
    fotoProfil?: string | null;
    alamatAsal?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginResponse = {
    message: string;
    token: string;
    user: User;
};

export type ProfileResponse = {
    user: User;
};

export type DashboardKeluhanStatus = "pending" | "proses" | "selesai";

export type AdminDashboardSummary = {
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
    recent_keluhan: Array<{
        judul: string;
        status: DashboardKeluhanStatus;
        tanggal: string;
    }>;
};

export type PenyewaDashboardSummary = {
    cards: {
        kamar_saya: string;
        tagihan_aktif: number;
        status_pembayaran: string;
        sisa_masa_sewa: string;
        keluhan_saya: number;
    };
    kamar: {
        nomor_kamar: string | null;
        fasilitas: string | null;
        harga_bulanan: number | null;
        status_kamar: string | null;
    } | null;
    tagihan_terbaru: {
        kode_invoice: string;
        tanggal_jatuh_tempo: string;
        total_tagihan: number;
        status_tagihan: string;
    } | null;
    kontrak: {
        tanggal_masuk: string;
        tanggal_keluar: string | null;
        durasi_sewa_bulan: number;
        status_sewa: string;
        progress_persen: number;
        sisa_masa_sewa: string;
    } | null;
    keluhan_terakhir: Array<{
        judul: string;
        status: DashboardKeluhanStatus;
        tanggal: string;
    }>;
};