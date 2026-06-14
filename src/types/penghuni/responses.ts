import type { KamarStatus } from "@/types/kamar";
import type { PaginationMeta } from "@/types/pagination";

/**
 * Tipe data response dari API Server untuk fitur Data Penghuni.
 * Berisi representasi read-only data dari database server.
 */

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
        status_kamar: KamarStatus | null;
    };
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

