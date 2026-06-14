import type { PerpanjangPayload } from "@/types/sewa";

export class SewaExtensionBuilder {
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

export { SewaExtensionBuilder as PerpanjanganSewaBuilder };
