import type { Penghuni } from "@/types/penghuni";

export interface PerpanjangPayload {
  tanggal_mulai: string;
  durasi_sewa_bulan: number;
}

export interface PerpanjangResponse {
  message?: string;
  data?: {
    sewa?: Penghuni;
    tagihan?: unknown;
  };
}
