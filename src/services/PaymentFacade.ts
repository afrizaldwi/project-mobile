import { tagihanApi } from '@/api/tagihanApi';

export class PaymentFacade {
  // Facade untuk Verifikasi Terima (Admin)
  static async verifyPayment(id: number, catatan: string) {
    return await tagihanApi.verifyPayment(id, catatan);
  }

  // Facade untuk Verifikasi Tolak (Admin)
  static async rejectPayment(id: number, catatan: string) {
    return await tagihanApi.rejectPayment(id, catatan);
  }

  // Facade untuk Upload Bukti (Penyewa)
  static async uploadProof(id: number, data: FormData) {
    return await tagihanApi.uploadPaymentProof(id, data);
  }
}