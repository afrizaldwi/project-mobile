import { InvoiceListItemResponse } from "@/types/invoice";

export class InvoicePdfFactory {
  static generateHtml(invoice: InvoiceListItemResponse): string {
    const formatDate = (dateString?: string) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const formatRupiah = (amount?: number) => {
      if (amount === undefined) return "Rp 0";
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    };

    return `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
                        color: #333;
                        line-height: 1.6;
                        padding: 40px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .title {
                        font-size: 28px;
                        font-weight: bold;
                        color: #1a1a1a;
                    }
                    .invoice-info p {
                        margin: 4px 0;
                        font-size: 14px;
                    }
                    .details-container {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 40px;
                    }
                    .details-box {
                        width: 45%;
                    }
                    .details-box h3 {
                        margin-bottom: 10px;
                        color: #555;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                        font-size: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #f8f9fa;
                        font-weight: bold;
                    }
                    .total-row {
                        font-weight: bold;
                        background-color: #f8f9fa;
                    }
                    .total-amount {
                        font-size: 20px;
                        color: #2e7d32;
                    }
                    .footer {
                        text-align: center;
                        color: #777;
                        margin-top: 50px;
                        font-size: 12px;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="title">INVOICE PEMBAYARAN</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">Kost Sejahtera</div>
                    </div>
                    <div class="invoice-info" style="text-align: right;">
                        <p><strong>No Invoice:</strong> ${invoice.kode_invoice || "INV-000"}</p>
                        <p><strong>Tanggal:</strong> ${formatDate(invoice.tanggal_bayar ?? undefined)}</p>
                        <p><strong>Status:</strong> <span style="color: #2e7d32; font-weight: bold;">LUNAS</span></p>
                    </div>
                </div>

                <div class="details-container">
                    <div class="details-box">
                        <h3>Ditagihkan Kepada:</h3>
                        <p><strong>${invoice.penyewa?.nama_lengkap || "Nama Penghuni"}</strong></p>
                        <p>${invoice.penyewa?.email || "Email"}</p>
                        <p>${invoice.penyewa?.no_hp || "-"}</p>
                    </div>
                    <div class="details-box">
                        <h3>Detail Kamar:</h3>
                        <p><strong>Kamar: ${invoice.kamar?.nomor_kamar || "-"}</strong></p>
                        <p>Tipe: Standar</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Deskripsi</th>
                            <th>Metode Pembayaran</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Pembayaran Sewa Kamar ${invoice.kamar?.nomor_kamar || "-"}</td>
                            <td style="text-transform: capitalize;">${invoice.metode_pembayaran || "-"}</td>
                            <td style="text-align: right;">${formatRupiah(Number(invoice.jumlah_bayar))}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="2" style="text-align: right;">TOTAL DIBAYARKAN</td>
                            <td style="text-align: right;" class="total-amount">${formatRupiah(Number(invoice.jumlah_bayar))}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    <p>Terima kasih atas pembayaran Anda.</p>
                    <p>Dokumen ini adalah bukti pembayaran yang sah dan diterbitkan secara otomatis oleh sistem.</p>
                </div>
            </body>
            </html>
        `;
  }
}
