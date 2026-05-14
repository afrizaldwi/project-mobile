## 1. Clone Repository

```bash
git clone <url-repository-mobile>
cd <repository-mobile>
```

````

---

## 2. Install Dependency

Jalankan perintah berikut:

```bash
npm install
```

---

## 3. Buat File Environment

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

## 4. Jalankan Backend Laravel

Sebelum menjalankan aplikasi mobile, jalankan backend dari project web terlebih dahulu.

Pastikan container backend dan nginx berjalan.

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

## 5. Cek IP Laptop

Cari IP laptop yang digunakan pada jaringan Wi-Fi.

Di Windows, jalankan:

```bash
ipconfig
```

Cari bagian adapter Wi-Fi, lalu lihat nilai:

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

## 6. Cek Koneksi Backend dari HP

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

## 7. Jalankan Project Mobile

Jalankan Expo:

```bash
npx expo start -c
```

Scan QR code menggunakan aplikasi **Expo Go** di HP Android.

---
````
