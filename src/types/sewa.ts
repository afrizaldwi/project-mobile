export interface PerpanjangPayload {
  tanggal_mulai: string;
  durasi_sewa_bulan: number;
}

/**
 * The extension screen only consumes the confirmation message.
 * The backend also returns extension data, but that data is not used
 * as an application boundary on mobile.
 */
export interface PerpanjangResponse {
  message: string;
}
