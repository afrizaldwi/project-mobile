# Panduan Instalasi

## 1. Clone Repository

Clone repository mobile:

```bash
git clone https://github.com/Manajemen-Kost/Basecamp-Kost-Mobile.git
cd Basecamp-Kost-Mobile
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

http://IP_LAPTOP:8000

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
Fitur ini mencakup:

- Validasi email dan password.
- Autentikasi pengguna melalui server Laravel.
- Penyimpanan token autentikasi setelah login berhasil.
- Penanganan pesan kesalahan ketika kredensial tidak valid.
- Pengalihan pengguna ke halaman dashboard setelah proses login berhasil.
- Pembatasan akses halaman bagi pengguna yang belum terautentikasi.

## Dashboard

Dashboard merupakan halaman utama yang ditampilkan setelah pengguna berhasil login. Halaman ini memberikan gambaran umum mengenai informasi penting dalam sistem Manajemen Kost.

- Menampilkan ringkasan data utama pengelolaan kost seperti total kamar, penghuni aktif, tigahan yang belum dibayar, pendapatan bulan ini, dan total keluhan dengan status menunggu.
- Menyajikan informasi dalam bentuk kartu statistik agar mudah dibaca.
- Menampilkan distribusi status kamar dan status tagihan dalam bentuk doughnut chart.
- Menampilkan distribusi status keluhan dalam bentuk bar chart.
- Menampilkan daftar keluhan terbaru dalam tabel.

## Laporan Kerusakan (Keluhan)

**Cara Kerja Teknis:**

- **Prasyarat:** Penyewa harus punya akun role `penyewa` dan memiliki sewa aktif (`riwayat_sewa.status_sewa = 'aktif'`). Kalau tidak ada sewa aktif, penyewa tidak bisa membuat laporan.
- **Penyewa buat laporan** via mobile/web: `POST /api/penyewa/keluhan` — kirim `judul_keluhan`, `deskripsi_keluhan`, dan maksimal 3 foto (format JPG/PNG, max 5MB per file). Data masuk ke tabel `keluhan` dengan `status_keluhan = 'pending'`.
- **Foto muncul di Dashboard Admin:** Admin buka halaman AdminDashboard → panggil `GET /admin/dashboard-summary` → data `recent_keluhan` (5 laporan terbaru) ditampilkan di komponen `RecentKeluhanTable`. Foto keluhan bisa dilihat via tombol "Foto 1/2/3" di `KeluhanTable`.
- **Admin tindak lanjuti** via web/mobile: `PATCH /admin/keluhan/{id}/status` — ubah status dari `pending` → `proses` → `selesai`. Begitu status diubah, penyewa bisa lihat update di `GET /penyewa/keluhan`.
- **Alur data lengkap:** Keluhan → RiwayatSewa → User (penghuni) + Kamar (nomor kamar). Semua relasi pakai Eloquent `with()`.

**Dependencies:**

```
RiwayatSewa (aktif) → User (penyewa) → bisa buat Keluhan
User (admin) → bisa lihat semua Keluhan + update status
```

## Pendataan Tamu (Buku Tamu)

**Cara Kerja Teknis:**

- **Prasyarat:** User sudah login (role penyewa atau admin).
- **Penyewa catat tamu:** `POST /api/penyewa/tamu` — isi `nama_tamu`, `no_hp_tamu`, `keperluan`. `bertemu_dengan` otomatis diisi ID penyewa yang login.
- **Admin catat tamu:** `POST /api/admin/tamu` — isi sama + `id_user` untuk memilih penghuni yang dikunjungi (data diambil dari `GET /admin/tamu/penghuni-aktif`).
- **Data masuk** ke tabel `buku_tamu` dengan `waktu_berkunjung` otomatis terisi via `now()`.
- **Lihat data:** Admin lihat semua via `GET /admin/tamu` (pagination + search), penyewa lihat tamunya sendiri via `GET /penyewa/tamu`.
- **Relasi:** BukuTamu → User (dikunjungi) → RiwayatSewa → Kamar (nomor kamar).

**Dependencies:**

```
User (penyewa/admin login) → bisa catat Tamu
User (penyewa dengan RiwayatSewa aktif) → muncul di dropdown penghuni-aktif
```

## Fitur Notifikasi Jatuh Tempo

Fitur Notifikasi Jatuh Tempo digunakan untuk mendeteksi tagihan yang mendekati batas waktu pembayaran secara otomatis dan mengirimkan pengingat kepada penyewa maupun admin. Sistem akan memproses data tagihan yang berstatus 'belum_bayar' atau 'telat' dengan tanggal jatuh tempo kurang dari atau sama dengan 7 hari ke depan (H-7). Informasi yang diambil mencakup nama penyewa, nomor kamar, kode invoice, tanggal jatuh tempo, dan token perangkat penyewa untuk kemudian dikirimkan dalam bentuk notifikasi sistem di dalam aplikasi serta push notification via Firebase Cloud Messaging (FCM). Untuk mencegah duplikasi pengiriman, sistem membatasi notifikasi maksimal satu kali sehari per tagihan berdasarkan tanggal pengiriman terakhir. Dengan adanya fitur ini, penyewa dapat menghindari denda keterlambatan pembayaran dan admin tidak perlu melakukan pengecekan tagihan secara manual satu per satu.

## Fitur Penagihan WhatsApp

Fitur Penagihan WhatsApp digunakan oleh admin untuk mengirimkan pesan pengingat pembayaran langsung ke nomor kontak WhatsApp penyewa secara praktis. Sistem akan mengambil informasi penting dari tagihan aktif seperti nama lengkap penyewa, nomor handphone, nomor kamar, kode invoice, total nominal tagihan, dan tanggal jatuh tempo. Menormalisasi format nomor telepon penyewa (mengonversi awalan nomor menjadi format internasional '62') dan menyusun draf pesan penagihan secara dinamis. Hasil akhirnya berupa tautan API WhatsApp resmi (wa.me) yang sudah ter-URL encode sehingga admin dapat langsung membukanya dari dashboard untuk mengirimkan pesan chat instan tersebut. Fitur ini mempermudah admin dalam melakukan penagihan secara personal dan cepat tanpa harus menyalin data atau mengetik ulang teks tagihan secara manual.

## Fitur Data Penghuni

Fitur Data Penghuni digunakan untuk mengelola informasi penghuni yang terdaftar dalam sistem, seperti nama, nomor kamar atau unit, kontak, serta status penghuni. Admin dapat menambahkan, mengubah, melihat, dan menghapus data penghuni sesuai kebutuhan. Data yang tersimpan membantu proses pendataan menjadi lebih terstruktur dan memudahkan pencarian informasi penghuni. Dengan sistem digital, pengelolaan data menjadi lebih cepat dan mengurangi risiko kesalahan pencatatan manual.

## Invoice Transaksi

Fitur Invoice Transaksi digunakan untuk menghasilkan invoice pembayaran secara otomatis berdasarkan data transaksi yang telah dilakukan oleh penyewa. Sistem akan mengambil informasi seperti nama penyewa, nomor kamar, periode sewa, nominal pembayaran, dan status pembayaran untuk kemudian disusun menjadi dokumen invoice yang terstruktur. Invoice yang telah dibuat dapat ditampilkan melalui aplikasi dan diunduh dalam format PDF sehingga memudahkan proses dokumentasi maupun pembagian bukti pembayaran kepada penyewa. Dengan adanya fitur ini, proses pembuatan invoice menjadi lebih cepat, akurat, dan mengurangi risiko kesalahan pencatatan secara manual.

## Laporan Keuangan

Fitur Laporan Keuangan digunakan untuk mencatat dan menampilkan seluruh transaksi keuangan yang berkaitan dengan penghuni, seperti pembayaran iuran, biaya sewa, atau tagihan lainnya. Sistem akan mengolah data transaksi menjadi laporan yang menampilkan total pemasukan, riwayat pembayaran, dan rekap keuangan dalam periode tertentu. Fitur ini membantu admin dalam memantau kondisi keuangan secara lebih akurat dan efisien. Selain itu, laporan dapat digunakan sebagai bahan evaluasi dan dokumentasi keuangan.

## Fitur Manajemen Data Kamar

digunakan untuk mengelola seluruh informasi kamar kos yang tersedia. Admin dapat menambah, mengubah, menghapus, serta melihat data kamar. Selain itu, admin dapat mengunggah foto fasilitas kamar dan mengatur harga sewa sesuai dengan kondisi atau tipe kamar. Fitur ini membantu pengelolaan inventaris kamar menjadi lebih terorganisir dan mudah diperbarui.

## Perpanjangan Masa Sewa

digunakan untuk memperbarui kontrak sewa penyewa yang akan habis masa berlakunya. Ketika penyewa melakukan perpanjangan, sistem secara otomatis menghitung tanggal berakhir sewa yang baru berdasarkan durasi yang dipilih serta menghitung total biaya yang harus dibayarkan. Dengan fitur ini, proses perpanjangan kontrak menjadi lebih cepat, akurat, dan mengurangi kesalahan perhitungan yang biasanya terjadi pada pencatatan manual.
