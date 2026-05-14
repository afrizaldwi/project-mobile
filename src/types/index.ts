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