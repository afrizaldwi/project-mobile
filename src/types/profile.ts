export type ProfileRole = "admin" | "penyewa";

export type ProfileSewa = {
    tanggal_masuk: string | null;
    tanggal_keluar: string | null;
    status_sewa: string | null;
};

export type ProfileKamar = {
    nomor_kamar: string | null;
    status_kamar: string | null;
};

export type ProfileUser = {
    id: number;
    nama_lengkap: string;
    email: string;
    role: ProfileRole;
    no_hp: string | null;
    foto_profil: string | null;
    alamat_asal: string | null;
    created_at: string | null;
    updated_at: string | null;
    status_sewa: string | null;
    sewa: ProfileSewa | null;
    kamar: ProfileKamar | null;
};

export type ProfileResponse = {
    user: ProfileUser;
};

export type PasswordChangePayload = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

export type PasswordChangeResponse = {
    message?: string;
};
