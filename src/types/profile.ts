import type { UserRole } from "@/types/auth";

export const PROFILE_SEWA_STATUSES = [
    "aktif",
    "selesai",
    "dibatalkan",
] as const;

export const PROFILE_KAMAR_STATUSES = [
    "tersedia",
    "terisi",
    "perbaikan",
] as const;

export type ProfileSewaStatus = (typeof PROFILE_SEWA_STATUSES)[number];
export type ProfileKamarStatus = (typeof PROFILE_KAMAR_STATUSES)[number];

export function normalizeNullableProfileSewaStatus(
    value: unknown,
    fieldName: string,
): ProfileSewaStatus | null {
    if (value === null || value === undefined) return null;

    if (
        typeof value !== "string" ||
        !PROFILE_SEWA_STATUSES.includes(value as ProfileSewaStatus)
    ) {
        throw new Error(`Status sewa profil tidak valid: ${fieldName}.`);
    }

    return value as ProfileSewaStatus;
}

export function normalizeNullableProfileKamarStatus(
    value: unknown,
    fieldName: string,
): ProfileKamarStatus | null {
    if (value === null || value === undefined) return null;

    if (
        typeof value !== "string" ||
        !PROFILE_KAMAR_STATUSES.includes(value as ProfileKamarStatus)
    ) {
        throw new Error(`Status kamar profil tidak valid: ${fieldName}.`);
    }

    return value as ProfileKamarStatus;
}

export type ProfileSewa = {
    tanggal_masuk: string | null;
    tanggal_keluar: string | null;
    status_sewa: ProfileSewaStatus | null;
};

export type ProfileKamar = {
    nomor_kamar: string | null;
    status_kamar: ProfileKamarStatus | null;
};

export type ProfileUser = {
    id: number;
    nama_lengkap: string;
    email: string;
    role: UserRole;
    no_hp: string | null;
    foto_profil: string | null;
    alamat_asal: string | null;
    created_at: string | null;
    updated_at: string | null;
    status_sewa: ProfileSewaStatus | null;
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
    message: string;
};
