# 📦 Sistem Peminjaman Barang SMKN 2
### Berbasis *Trust Point*

> **Karya / Tugas Pemrograman**  
> **Guru:** Pak Jimmy  
> **Kelas:** XI RPL 1  
> **Nama:** Raka Sabari Pratama  
> **No. Absen:** 35  
> **Sekolah:** SMKN 2

---

## 📖 Tentang Karya

**Sistem Peminjaman Barang SMKN 2** adalah aplikasi pengelolaan peminjaman barang inventaris sekolah yang dilengkapi dengan sistem **Trust Point**. Sistem ini dibuat untuk membantu proses peminjaman menjadi lebih teratur, transparan, dan mudah dipantau oleh admin maupun siswa.

Konsep utama aplikasi adalah memberikan **poin kepercayaan** kepada setiap siswa berdasarkan kedisiplinan dan kondisi barang saat dikembalikan. Dengan demikian, riwayat peminjaman tidak hanya tercatat, tetapi juga dapat digunakan sebagai indikator tanggung jawab pengguna.

Proyek ini dikembangkan menggunakan:

- **Backend:** Laravel + REST API
- **Frontend:** React + Vite
- **Database:** MySQL / MariaDB
- **Authentication:** Laravel Sanctum

---

## 🎯 Tujuan Pembuatan

Aplikasi ini dibuat dengan tujuan:

1. Mempermudah pengelolaan inventaris sekolah.
2. Mempermudah proses peminjaman dan pengembalian barang.
3. Mencatat riwayat transaksi peminjaman dengan lebih terstruktur.
4. Menerapkan sistem **Trust Point** sebagai penilaian kedisiplinan siswa.
5. Mengurangi kesalahan pencatatan stok secara manual.

---

## 🚀 Fitur Utama

### 🔐 Autentikasi & Role

- Login dan register pengguna.
- Manajemen role **Admin** dan **Siswa**.
- Autentikasi API menggunakan Laravel Sanctum.

### 📦 Manajemen Barang & Kategori

- Tambah, lihat, ubah, dan hapus data barang.
- Pengelolaan kategori inventaris.
- Dukungan gambar barang.
- Informasi stok barang.

### ⭐ Sistem Trust Point

Setiap siswa memiliki poin kepercayaan dengan aturan dasar berikut:

| Kondisi | Perubahan Poin |
|---|---:|
| Poin awal | **100** |
| Mengembalikan tepat waktu | **+5** |
| Mengembalikan terlambat | **-10** |
| Barang dikembalikan dalam kondisi rusak | **-20** |
| Poin mencapai 0 | **Akun diblokir otomatis** |

> Nilai poin dan aturan penalti/reward dapat disesuaikan kembali sesuai kebutuhan sistem.

### 📝 Peminjaman Barang

- Pengajuan peminjaman oleh siswa.
- Validasi stok secara otomatis.
- Persetujuan (*approval*) oleh admin.
- Pencatatan kondisi barang saat pengembalian.
- Stok diperbarui berdasarkan status peminjaman.

### 🧪 Testing

Sistem dilengkapi **Feature Tests** untuk memeriksa logika penting seperti stok dan Trust Point.

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| **Laravel** | Backend dan REST API |
| **PHP** | Bahasa pemrograman backend |
| **React** | Antarmuka pengguna (*frontend*) |
| **Vite** | Build tool dan development server frontend |
| **MySQL / MariaDB** | Database |
| **Laravel Sanctum** | Autentikasi API |
| **Node.js & npm** | Dependency dan development frontend |
| **Composer** | Dependency manager PHP |

---

## 📋 Prasyarat

Pastikan perangkat lunak berikut sudah terpasang di komputer:

- **PHP 8.1** atau lebih baru
- **Composer**
- **Node.js** dan **npm**
- **MySQL** atau **MariaDB**
- **Git** (disarankan)

---

## ⚙️ Instalasi & Menjalankan Aplikasi

### 1. Clone Repository

```bash
git clone <URL_REPOSITORY>
cd <NAMA_FOLDER_PROJECT>
```

> Ganti `<URL_REPOSITORY>` dan `<NAMA_FOLDER_PROJECT>` sesuai repository yang digunakan.

---

### 2. Konfigurasi Backend (Laravel API)

Masuk ke folder backend:

```bash
cd backend
```

Install dependency Laravel:

```bash
composer install
```

Buat file environment:

```bash
cp .env.example .env
```

Pada Windows Command Prompt, alternatifnya:

```cmd
copy .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

---

### 3. Konfigurasi Database

Buat database baru di MySQL / MariaDB, misalnya:

```text
penyimpanan
```

Kemudian sesuaikan konfigurasi pada file `.env`:

```env
APP_ENV=local
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=penyimpanan
DB_USERNAME=root
DB_PASSWORD=
```

> **Catatan:** Port MySQL tidak selalu `3307`. Jika server lokal menggunakan port lain, sesuaikan `DB_PORT` dengan konfigurasi MySQL Anda.

Setelah database siap, jalankan migrasi:

```bash
php artisan migrate
```

Jika project menyediakan seeder, gunakan:

```bash
php artisan db:seed
```

atau:

```bash
php artisan migrate --seed
```

---

### 4. Menjalankan Backend

```bash
php artisan serve
```

Secara default, API Laravel dapat diakses melalui:

```text
http://127.0.0.1:8000
```

Endpoint API biasanya tersedia pada:

```text
http://127.0.0.1:8000/api
```

---

### 5. Konfigurasi Frontend (React + Vite)

Buka terminal baru, lalu masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Buat atau sesuaikan file `.env` frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Kemudian jalankan server development:

```bash
npm run dev
```

Frontend biasanya dapat diakses melalui:

```text
http://localhost:5173
```

> Gunakan URL yang ditampilkan oleh terminal apabila Vite menjalankan server pada port yang berbeda.

---

## 🧩 Struktur Project

Struktur sederhana project:

```text
project/
├── backend/                 # Laravel REST API
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   └── .env
│
├── frontend/                # React + Vite
│   ├── src/
│   ├── public/
│   └── .env
│
└── README.md
```

Struktur aktual dapat sedikit berbeda tergantung susunan repository yang digunakan.

---

## 🧪 Pengujian (*Testing*)

Untuk menjalankan seluruh test Laravel, masuk ke folder `backend` kemudian jalankan:

```bash
php artisan test
```

### Skenario Pengujian

Pengujian mencakup logika penting seperti:

- Peminjaman ditolak apabila stok tidak mencukupi.
- *Approval* peminjaman mengurangi stok barang.
- Pengembalian barang mengembalikan stok.
- Pengembalian tepat waktu memberikan tambahan Trust Point.
- Pengembalian terlambat mengurangi Trust Point.
- Barang rusak memberikan penalti Trust Point.
- Akun diblokir otomatis ketika Trust Point mencapai 0.

---

## 📚 Dokumentasi API

Backend menggunakan **REST API** dengan format data utama:

```http
Content-Type: application/json
```

Autentikasi API menggunakan **Laravel Sanctum**.

Dokumentasi endpoint dapat ditempatkan pada dokumentasi API terpisah atau koleksi **Postman** yang digunakan saat pengembangan.

Contoh format endpoint:

```text
POST   /api/login
POST   /api/register
GET    /api/barang
POST   /api/peminjaman
PUT    /api/peminjaman/{id}
POST   /api/peminjaman/{id}/return
```

> Nama endpoint di atas merupakan contoh dan perlu disesuaikan dengan route yang benar-benar tersedia di project.

---

## 🔄 Alur Sistem Singkat

```text
Siswa Login
    ↓
Melihat Daftar Barang
    ↓
Mengajukan Peminjaman
    ↓
Admin Memeriksa Pengajuan
    ↓
Peminjaman Disetujui
    ↓
Stok Barang Berkurang
    ↓
Siswa Mengembalikan Barang
    ↓
Cek Ketepatan Waktu & Kondisi Barang
    ↓
Trust Point Diperbarui
    ↓
Stok Barang Kembali
```

---

## ⭐ Konsep Trust Point

Sistem Trust Point dirancang agar pengguna memiliki riwayat tanggung jawab dalam menggunakan inventaris sekolah.

Contoh:

```text
Trust Point awal
      100
       │
       ├── Tepat waktu → +5
       │
       ├── Terlambat   → -10
       │
       └── Rusak       → -20
       │
       ↓
  Point <= 0
       │
       ↓
 Akun diblokir
```

Dengan pendekatan ini, siswa yang menjaga barang dan disiplin dalam pengembalian akan memiliki **Trust Point** yang lebih baik.

---

## 👤 Identitas Pembuat

**Nama:** Raka Sabari Pratama  
**Kelas:** XI RPL 1  
**No. Absen:** 35  
**Sekolah:** SMKN 2  
**Guru:** Pak Jimmy

---

## 📌 Catatan

Project ini dibuat sebagai **karya/tugas pembelajaran pemrograman** dan masih dapat dikembangkan lebih lanjut, misalnya dengan:

- Dashboard admin yang lebih lengkap.
- Riwayat peminjaman siswa.
- Notifikasi jatuh tempo.
- Filter dan pencarian barang.
- Laporan inventaris.
- Sistem denda atau aturan tambahan.
- Dokumentasi API yang lebih lengkap.

---

## 📄 Lisensi

Project ini dibuat untuk keperluan **pembelajaran dan tugas sekolah**. Penggunaan kembali kode dapat disesuaikan dengan ketentuan repository dan project yang digunakan.
****
