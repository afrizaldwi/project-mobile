export type {
    LoginPayload,
    LoginResponse,
    LoginUserResponse,
    User,
    UserRole,
} from "@/types/auth";

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


export type Keluhan = {
    id_keluhan: number;
    id_sewa: number;
    judul_keluhan: string;
    deskripsi_keluhan: string;
    foto_kerusakan: string | null;
    foto_kerusakan_url: string | null;
    status_keluhan: "pending" | "proses" | "selesai";
    tanggal_lapor: string;
    tanggal_selesai: string | null;
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
export type {
    PasswordChangePayload,
    PasswordChangeResponse,
    ProfileKamar,
    ProfileResponse,
    ProfileSewa,
    ProfileUser,
} from "@/types/profile";
