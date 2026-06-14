export type UserRole = "admin" | "penyewa";

export type User = {
    id: number;
    nama_lengkap: string;
    email: string;
    role: UserRole;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginUserResponse = User & {
    no_hp: string;
    foto_profil: string | null;
    alamat_asal: string | null;
    created_at: string;
    updated_at: string;
};

export type LoginResponse = {
    message: string;
    token: string;
    access_token: string;
    token_type: "bearer";
    expires_in: number;
    user: LoginUserResponse;
};
