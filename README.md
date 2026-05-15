## 1. Clone Repository

Clone repository mobile:

```bash
git clone <url-repository-mobile>
cd <repository-mobile>
```

---

## 2. Pindah ke Branch Develop

Untuk development, gunakan branch `develop`.

Jalankan:

```bash
git checkout develop
```

Pastikan branch aktif sudah benar:

```bash
git branch -a
```

Branch aktif ditandai dengan simbol `*`.

Contoh:

```text
* develop
  main
```

---

## 3. Install Dependency

Jalankan perintah berikut:

```bash
npm install
```

---

## 4. Buat File Environment

Buat file `.env` di root project.

Contoh struktur:

```text
project-mobile/
├── .env
├── package.json
├── src/
└── ...
```

Isi file `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://IP_LAPTOP_ANDA:8000/api
```

Contoh:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000/api
```

URL wajib menggunakan `http://` atau `https://`.

Benar:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000/api
```

Salah:

```env
EXPO_PUBLIC_API_BASE_URL=192.168.x.x:8000/api
```

---

## 5. Jalankan Backend

Sebelum menjalankan aplikasi mobile, jalankan backend dari project web terlebih dahulu.

Pastikan container backend, nginx, dan database di Docker Desktop berjalan.

Cek dari browser laptop:

```text
http://localhost:8000/api/profile
```

Jika muncul:

```text
Unauthenticated
```

berarti backend sudah berjalan.

---

## 6. Cek IP Laptop

Cari IP laptop yang digunakan pada jaringan Wi-Fi.

Di Windows, jalankan:

```bash
ipconfig
```

Cari bagian adapter Wi-Fi, lalu lihat:

```text
IPv4 Address
```

Contoh:

```text
192.168.x.x
```

IP tersebut digunakan pada file `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000/api
```

---

## 7. Cek Koneksi Backend dari HP

Pastikan HP dan laptop berada di jaringan yang sama.

Buka browser di HP, lalu akses:

```text
http://IP_LAPTOP_ANDA:8000/api/profile
```

Contoh:

```text
http://192.168.x.x:8000/api/profile
```

Jika muncul:

```text
Unauthenticated
```

berarti HP sudah bisa mengakses backend.

Jika tidak bisa diakses, periksa:

- IP laptop sudah benar
- HP dan laptop berada di jaringan yang sama
- Backend Docker sudah berjalan
- Port `8000` tidak diblokir firewall
- URL di `.env` sudah benar
- Network laptop sebaiknya menggunakan mode Private jika berada di jaringan terpercaya

---

## 8. Jalankan Project Mobile

Jalankan Expo:

```bash
npx expo start -c
```

Scan QR code menggunakan aplikasi **Expo Go** di HP Android.

---

## 9. Cek Aplikasi

Setelah aplikasi terbuka di Expo Go, lakukan pengecekan berikut:

- Login admin berhasil
- Login penyewa berhasil
- Logout berhasil
- Navigasi admin bisa diakses
- Navigasi penyewa bisa diakses
- Role admin tidak bisa mengakses halaman penyewa
- Role penyewa tidak bisa mengakses halaman admin

---

## 10. Checklist Sebelum Development

Pastikan semua ini sudah berhasil:

- Sudah berada di branch `develop`
- Dependency sudah diinstall
- File `.env` sudah dibuat
- URL di `.env` menggunakan `http://`
- Backend Laravel berjalan
- HP bisa membuka `/api/profile`
- Expo Go bisa membuka aplikasi
- Login admin berhasil
- Login penyewa berhasil
- Logout berhasil

---

## 11. Membuat Branch Fitur

Sebelum membuat fitur baru, pastikan berada di branch `develop` dan branch tersebut sudah terbaru.

```bash
git checkout develop
```

Buat branch fitur dari `develop`:

```bash
git checkout -b fitur-nama
```

Contoh:

```bash
git checkout -b fitur-afrizal
```
