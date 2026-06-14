import type { TagihanReminderItem } from "@/types/tagihan";

export const isPaidOrVerified = (item: TagihanReminderItem) => {
  return (
    item.status_tagihan === "lunas" ||
    item.pembayaran_terbaru?.status_verifikasi === "diterima"
  );
};
