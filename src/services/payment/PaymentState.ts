import type { TagihanReminderItem } from "@/types/tagihan";

export interface PaymentState {
  getStatusLabel(isAdmin?: boolean): string;
  getStatusColor(): string;
  getStatusBg(): string;
  canPay(): boolean;
}

export class LunasState implements PaymentState {
  getStatusLabel() { return "Lunas"; }
  getStatusColor() { return "#16a34a"; }
  getStatusBg() { return "#f0fdf4"; }
  canPay() { return false; }
}

export class PendingState implements PaymentState {
  getStatusLabel(isAdmin = false) {
    return isAdmin ? "Menunggu" : "Menunggu Verifikasi";
  }
  getStatusColor() { return "#d97706"; }
  getStatusBg() { return "#fffbeb"; }
  canPay() { return false; }
}

export class DitolakState implements PaymentState {
  getStatusLabel() { return "Ditolak"; }
  getStatusColor() { return "#dc2626"; }
  getStatusBg() { return "#fef2f2"; }
  canPay() { return true; }
}

export class TelatState implements PaymentState {
  getStatusLabel() { return "Telat"; }
  getStatusColor() { return "#dc2626"; }
  getStatusBg() { return "#fef2f2"; }
  canPay() { return true; }
}

export class BelumBayarState implements PaymentState {
  getStatusLabel() { return "Belum Bayar"; }
  getStatusColor() { return "#dc2626"; }
  getStatusBg() { return "#fef2f2"; }
  canPay() { return true; }
}

export class DibatalkanState implements PaymentState {
  getStatusLabel() { return "Dibatalkan"; }
  getStatusColor() { return "#6b7280"; }
  getStatusBg() { return "#f3f4f6"; }
  canPay() { return false; }
}

export class PaymentStateContext {
  static getState(item: TagihanReminderItem): PaymentState {
    const paymentStatus = item.pembayaran_terbaru?.status_verifikasi;

    if (item.status_tagihan === "dibatalkan") {
      return new DibatalkanState();
    }
    if (item.status_tagihan === "lunas" || paymentStatus === "diterima") {
      return new LunasState();
    }
    if (paymentStatus === "pending") {
      return new PendingState();
    }
    if (paymentStatus === "ditolak") {
      return new DitolakState();
    }
    if (item.status_tagihan === "telat") {
      return new TelatState();
    }
    return new BelumBayarState();
  }
}
