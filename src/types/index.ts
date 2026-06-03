export type UserRole = "admin" | "penyewa";

export type User = {
    id: number;
    nama_lengkap: string;
    email: string;
    role: UserRole;
    noHp?: string;
    no_hp?: string | null;
    fotoProfil?: string | null;
    foto_profil?: string | null;
    alamatAsal?: string | null;
    alamat_asal?: string | null;
    createdAt?: string;
    created_at?: string | null;
    updatedAt?: string;
    updated_at?: string | null;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export interface Invoice {
    id: string;
    nomor_invoice: string;
    penghuni_id: string;
    penghuni_nama: string;
    kamar_nomor: string;
    periode_bulan: string;
    tanggal_jatuh_tempo: string;
    tanggal_bayar?: string;
    total_tagihan: number;
    status: 'belum_bayar' | 'sudah_bayar' | 'terlambat';
    items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
    keterangan: string;
    jumlah: number;
}

export interface LaporanKeuangan {
    periode: string;
    total_pemasukan: number;
    total_tagihan: number;
    total_lunas: number;
    total_belum_bayar: number;
    total_terlambat: number;
    transaksi: Transaksi[];
}

export interface Transaksi {
    id: string;
    invoice_id: string;
    nomor_invoice: string;
    penghuni_nama: string;
    kamar_nomor: string;
    jumlah: number;
    tanggal: string;
    metode_bayar: string;
    status: 'sukses' | 'gagal' | 'pending';
}

export type LoginResponse = {
    message: string;
    token?: string;
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    user: User;
};

export type ProfileResponse = {
    user: User;
};

export type Keluhan = {
    id_keluhan: number;
    id_sewa: number;
    judul_keluhan: string;
    deskripsi_keluhan: string;
    foto_kerusakan?: string | null;
    foto_kerusakan_url?: string | null;
    status_keluhan: "pending" | "proses" | "selesai";
    tanggal_lapor: string;
    tanggal_selesai?: string | null;
    nama_penghuni: string;
    email_penghuni: string;
    nomor_kamar: string;
};

export type Tamu = {
    id_tamu: number;
    nama_tamu: string;
    no_hp_tamu: string;
    keperluan: string;
    waktu_berkunjung: string;
    id_user: number;
    nama_penghuni: string;
    nomor_kamar: string;
}
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
    recent_keluhan: {
        judul: string;
        status: DashboardKeluhanStatus;
        tanggal: string;
    }[];
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
    keluhan_terakhir: {
        judul: string;
        status: DashboardKeluhanStatus;
        tanggal: string;
    }[];
};
