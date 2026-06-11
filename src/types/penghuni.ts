import type { KamarStatus } from "@/types/kamar";
import type { PaginationMeta } from "@/types/pagination";

export type StatusSewa = "aktif" | "selesai";
export type AdminPenghuniItemStatus = StatusSewa | "dibatalkan";
export type AdminPenghuniApiStatus = AdminPenghuniItemStatus | "all";

export interface AdminPenghuniItem {
    id_sewa: number;
    tanggal_masuk: string;
    tanggal_keluar: string | null;
    harga_deal: string;
    durasi_sewa_bulan: number;
    status_sewa: AdminPenghuniItemStatus;
    user: {
        id: number | null;
        nama_lengkap: string | null;
        email: string | null;
        no_hp: string | null;
        alamat_asal: string | null;
        foto_profil: string | null;
    };
    kamar: {
        id_kamar: number | null;
        nomor_kamar: string | null;
        fasilitas: string | null;
        harga_bulanan: string | null;
        luas_kamar: string | null;
        foto_kamar: string | null;
        status_kamar: KamarStatus | string | null;
    };
}

export interface AdminPenghuniListParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: AdminPenghuniApiStatus;
}

export interface GetAdminPenghuniOptions extends AdminPenghuniListParams {
    signal?: AbortSignal;
}

export interface AdminPenghuniListResponse {
    data: AdminPenghuniItem[];
    meta: PaginationMeta;
}

export type Penghuni = {
    id_sewa: number;
    id_user: number;
    id_kamar: number;
    nama: string;
    email: string;
    no_hp: string;
    nomor_kamar: string;
    harga_bulanan: number;
    harga_deal: number;
    tanggal_masuk: string;
    tanggal_keluar: string;
    durasi_sewa_bulan: number;
    status_sewa: StatusSewa;
};

export type PerpanjangPayload = {
    tanggal_mulai: string;
    durasi_sewa_bulan: number;
    harga_deal: number;
};

export type PerpanjangResponse = {
    message?: string;
    data?: {
        sewa?: Penghuni;
        tagihan?: unknown;
    };
};

export class PerpanjanganSewaBuilder {
    private tanggalMulai: string = "";
    private durasi: number = 0;
    private hargaBulanan: number = 0;

    setTanggalMulai(tanggal: string): this {
        this.tanggalMulai = tanggal;
        return this;
    }

    setDurasi(bulan: number): this {
        this.durasi = bulan;
        return this;
    }

    setHargaBulanan(harga: number): this {
        this.hargaBulanan = harga;
        return this;
    }

    build(): PerpanjangPayload {
        if (!this.tanggalMulai || !this.durasi || !this.hargaBulanan) {
            throw new Error("Data perpanjangan tidak lengkap");
        }

        return {
            tanggal_mulai: this.tanggalMulai,
            durasi_sewa_bulan: this.durasi,
            harga_deal: this.hargaBulanan * this.durasi,
        };
    }

    hitungEstimasi(): string {
        if (!this.tanggalMulai || !this.durasi) return "-";
        const tgl = new Date(this.tanggalMulai);
        tgl.setMonth(tgl.getMonth() + this.durasi);
        return tgl.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    hitungTotal(): number {
        return this.hargaBulanan * this.durasi;
    }
}
