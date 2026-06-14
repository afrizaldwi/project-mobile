import type { Penghuni } from "@/types/penghuni";

export type PerpanjangPayload = {
    tanggal_mulai: string;
    durasi_sewa_bulan: number;
    harga_deal: number;
};

export type PerpanjangResponse = {
    message?: string;
    data?: { sewa?: Penghuni; tagihan?: unknown };
};
