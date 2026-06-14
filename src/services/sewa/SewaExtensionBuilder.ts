import type { PerpanjangPayload } from "@/types/sewa";

export class SewaExtensionBuilder {
  private tanggalMulai = "";
  private durasi = 0;
  private hargaBulanan = 0;

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
    if (!this.tanggalMulai || !this.durasi) {
      throw new Error("Data perpanjangan tidak lengkap");
    }

    return {
      tanggal_mulai: this.tanggalMulai,
      durasi_sewa_bulan: this.durasi,
    };
  }

  hitungEstimasi(): string {
    if (!this.tanggalMulai || !this.durasi) return "-";

    const tanggal = new Date(this.tanggalMulai);
    tanggal.setMonth(tanggal.getMonth() + this.durasi);

    return tanggal.toLocaleDateString("id-ID", {
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
