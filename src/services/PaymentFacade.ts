import { tagihanApi } from "@/api/tagihanApi";
import type {
  PaymentReviewResponse,
  UploadPaymentProofResponse,
} from "@/types/tagihan";

export class PaymentFacade {
  static async verifyPayment(
    id: number,
    catatan: string,
  ): Promise<PaymentReviewResponse> {
    return tagihanApi.verifyPayment(id, catatan);
  }

  static async rejectPayment(
    id: number,
    catatan: string,
  ): Promise<PaymentReviewResponse> {
    return tagihanApi.rejectPayment(id, catatan);
  }

  static async uploadProof(
    id: number,
    data: FormData,
  ): Promise<UploadPaymentProofResponse> {
    return tagihanApi.uploadPaymentProof(id, data);
  }
}
