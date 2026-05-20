export type KamarStatus = "tersedia" | "terisi";

export type Kamar = {
    id_kamar: number;
    nomor_kamar: string;
    luas_kamar: string;
    fasilitas: string;
    harga_bulanan: number;
    status_kamar: KamarStatus;
    foto_kamar: string | null;
    created_at: string;
    updated_at: string;
};

export type FotoPayload = {
    uri: string;
    name: string;
    type: string;
};

export type KamarPayload = {
    nomor_kamar: string;
    luas_kamar: string;
    fasilitas: string;
    harga_bulanan: string;
    status_kamar: KamarStatus;
    foto_kamar?: FotoPayload;
};

export type KamarListResponse = {
    data: Kamar[];
    total: number;
    tersedia: number;
    terisi: number;
    perbaikan: number;
};