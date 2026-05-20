export type UserRole = "admin" | "penyewa";

export type User = {
    id: number;
    namaLengkap: string;
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
};