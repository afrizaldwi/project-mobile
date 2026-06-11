# Panduan Instalasi

## 1. Clone Repository

Clone repository mobile:

```bash
git clone <url-repository-mobile>
cd <repository-mobile>
```

---

## 2. Install Dependency

Jalankan perintah berikut:

```bash
npm install
```

---

## 3. Jalankan Server

Sebelum menjalankan aplikasi mobile, jalankan server dari project web terlebih dahulu.

Pastikan container server, nginx, dan database di Docker Desktop berjalan.

Cek dari browser laptop:

```text
http://localhost:8000
```

Jika muncul halaman laravel maka server sudah berjalan

---

## 4. Cek Koneksi dari HP

Pastikan HP dan laptop berada di jaringan yang sama. Buka browser HP dan akses:

http://IP_LAPTOP_ANDA:8000

Jika website laravel muncul, koneksi berhasil.

---

## 5. Jalankan Project Mobile

Jalankan Expo:

```bash
npx expo start -c
```

Scan QR code menggunakan aplikasi **Expo Go** di HP Android.

---

## 6. Cek Aplikasi

Setelah aplikasi terbuka di Expo Go, lakukan pengecekan berikut:

- Login admin berhasil
- Login penyewa berhasil
- Logout berhasil
- Navigasi admin bisa diakses
- Navigasi penyewa bisa diakses
- Role admin tidak bisa mengakses halaman penyewa
- Role penyewa tidak bisa mengakses halaman admin

---

# Features Developed

## Login

Fitur Login digunakan sebagai pintu masuk pengguna ke dalam sistem Manajemen Kost. Pengguna harus memasukkan kredensial yang valid sebelum dapat mengakses fitur yang tersedia.

## Dashboard

Dashboard merupakan halaman utama yang ditampilkan setelah pengguna berhasil login. Halaman ini memberikan gambaran umum mengenai informasi penting dalam sistem Manajemen Kost.

## Laporan Kerusakan

Menyediakan fitur bagi penyewa untuk melapor kerusakan via Mobile dan website dan ditindaklanjuti oleh Admin via Web dan mobile. Foto kerusakan yang diunggah penyewa dari Mobile akan muncul di halaman Admin sebagai tugas yang harus diselesaikan.

## Pendataan Tamu

Mengelola catatan kunjungan tamu harian secara terstruktur untuk keperluan keamanan kost.

## Fitur Notifikasi Jatuh Tempo

Mendeteksi tagihan yang mendekati tanggal jatuh tempo (kurang dari atau sama dengan 7 hari) dan otomatis membuat notifikasi sistem serta mengirimkan Push Notification ke HP penyewa.

## Fitur Penagihan WhatsApp

Mengirim pesan pengingat tagihan kost secara personal langsung ke WhatsApp penyewa dengan pesan yang sudah terformat otomatis.

## Fitur Data Penghuni

Fitur Data Penghuni digunakan untuk mengelola informasi penghuni yang terdaftar dalam sistem, seperti nama, alamat, nomor kamar atau unit, kontak, serta metode pembayaran. Admin dapat Mengelola basis data penghuni aktif serta sistem pengarsipan riwayat penyewaan untuk data alumni.

## Invoice Transaksi

Membuat generator invoice otomatis berbasis data pembayaran yang dapat diunduh dalam format PDF. Invoice yang dibuat oleh Admin di Web setelah pembayaran dikonfirmasi akan langsung tersedia untuk diunduh oleh Penyewa di Mobile.

## Laporan Keuangan

Mengolah data transaksi menjadi laporan periodik yang dapat diekspor ke format Excel (CSV).

## Manajemen Data Kamar

Mengelola data inventaris kamar kost, termasuk fitur unggah foto fasilitas, luas, status dan pengaturan harga sewa.

## Perpanjangan Masa Sewa

Membuat logika sistem kalkulasi otomatis untuk tanggal berakhir dan biaya sewa baru saat melakukan perpanjangan sewa.

## Laporan Keuangan

Mencatat pengeluaran operasional dan menghitung laba bersih kost (Pemasukan - Pengeluaran).

---
