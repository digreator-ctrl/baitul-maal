# Rencana Implementasi: Integrasi Database Nyata & Autentikasi Server

Dokumen ini memuat rencana kerja terperinci untuk **Tahap 4** dari pengembangan Aplikasi Baitul Maal Ponpes Ar-Rosyad, yaitu perpindahan dari data simulasi (*Mock Data*) menuju integrasi database sesungguhnya (Neon PostgreSQL + Prisma) serta implementasi Autentikasi Server (NextAuth.js).

---

## 1. Persiapan Infrastruktur & Database

**Target:** Memastikan koneksi ke database Neon PostgreSQL berjalan dengan baik dan struktur tabel sudah sesuai.

*   [ ] Memastikan *environment variables* (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) sudah diatur dengan benar di dalam berkas `.env`.
*   [ ] Meninjau kembali skema Prisma (`prisma/schema.prisma`) dan memastikan semua relasi tabel sudah terdefinisi.
*   [ ] Menjalankan migrasi database menggunakan perintah `npx prisma db push` atau `npx prisma migrate dev`.
*   [ ] Memastikan *seed* data awal (`prisma/seed.js`) berjalan lancar dan populasi data (*Roles*, *Users*, *Kategori*, dll.) berhasil masuk ke database.

## 2. Autentikasi Server (NextAuth.js)

**Target:** Mengganti alur login *frontend-only* dengan sistem autentikasi bersesi (*session-based*) yang aman dari sisi peladen (server).

*   [ ] **Instalasi:** Memastikan pustaka `next-auth` dan `bcryptjs` sudah terinstal.
*   [ ] **Konfigurasi:** Membuat berkas *route handler* untuk NextAuth (`app/api/auth/[...nextauth]/route.js`).
*   [ ] **Provider:** Mengonfigurasi `CredentialsProvider` untuk memverifikasi surel dan kata sandi menggunakan basis data (via Prisma) dan `bcrypt`.
*   [ ] **Callbacks:** Menyesuaikan `jwt` dan `session` callbacks pada NextAuth agar token sesi menyimpan informasi krusial pengguna (seperti `id`, `role`, dan `permissions`).
*   [ ] **Refaktor Konteks Auth:** Menghapus atau menyesuaikan `contexts/AuthContext.js` agar menggunakan `<SessionProvider>` dan memanggil `signIn()` / `signOut()` bawaan NextAuth.

## 3. Pembuatan API Routes & Server Actions

**Target:** Mengubah fungsi manipulasi data statis (dari `lib/mock.js`) menjadi antarmuka pemrograman aplikasi (API) / *Server Actions* yang terhubung ke database.

*   [ ] **Middleware & Proteksi API:** Memastikan setiap rute API (atau *Server Action*) memvalidasi sesi pengguna terlebih dahulu dan memeriksa hak akses (RBAC).
*   [ ] **Endpoint / Action - Pengaturan (Master Data):**
    *   Kategori Donasi, Metode Donasi, Pos Pengeluaran, Manajemen Pengguna & Peran (Role).
*   [ ] **Endpoint / Action - Donatur:**
    *   CRUD (Buat, Baca, Perbarui, Hapus) data Donatur.
*   [ ] **Endpoint / Action - Penerimaan (Donasi):**
    *   Pencatatan donasi baru oleh petugas.
    *   Fitur penyetoran ke bendahara dengan status (PENDING, DITERIMA, DITOLAK).
*   [ ] **Endpoint / Action - Keuangan:**
    *   Persetujuan/penolakan setoran oleh bendahara.
    *   Pencatatan pengeluaran.
    *   Perhitungan mutasi kas dan buku kas.
*   [ ] **Endpoint / Action - Dashboard & Laporan:**
    *   Fungsi agregasi untuk *Ringkasan Kas*, *Kinerja Petugas*, dan grafik pelaporan bulanan.

## 4. Refaktor UI & Contexts (Koneksi Frontend-Backend)

**Target:** Menyambungkan komponen antarmuka pengguna ke data yang diberikan oleh API / Server Actions yang baru dibuat.

*   [ ] **Halaman Login:** Mengganti fungsi `login()` *mock* dengan pemanggilan `signIn('credentials', ...)` dari NextAuth.
*   [ ] **Konteks Data (`contexts/DataContext.js`):**
    *   Secara bertahap, mengganti nilai awal *state* (yang sebelumnya berasal dari data tiruan) dengan *fetching* data asinkron dari API peladen.
    *   Memanfaatkan pustaka seperti SWR atau React Query untuk *data fetching* di *client-side* (jika menggunakan API Routes) guna mendapatkan reaktivitas dan *caching*, ATAU me-refaktor beberapa halaman menjadi *Server Components* untuk optimasi SEO & kecepatan awal.
*   [ ] **Umpan Balik (Feedback):** Memastikan semua form memberikan *loading state*, dan *error handling* jika *fetch* ke database gagal (menampilkan notifikasi atau Toast).

## 5. Pengujian & Penyesuaian

**Target:** Memastikan alur bisnis dan kontrol akses per-peran berjalan tanpa celah.

*   [ ] **Pengujian RBAC:** Masuk (*login*) menggunakan kelima *role* (SuperAdmin, Admin, Bendahara, Petugas, Pengawas) dan memastikan setiap *role* hanya dapat mengakses data dan fitur yang telah ditentukan di `lib/rbac.js`.
*   [ ] **Uji Alur Penerimaan:** Menguji alur pencatatan donasi oleh Petugas ➡️ Setoran ➡️ Verifikasi Diterima oleh Bendahara ➡️ Saldo bertambah.
*   [ ] **Uji Alur Pengeluaran:** Memastikan pengeluaran tidak bisa melebihi saldo metode kas yang dipilih.

## 6. Serah Terima & Rilis Tahap 4

*   [ ] Pembersihan *Mock Data*: Menghapus atau menonaktifkan berkas `lib/mock.js` jika sudah tidak digunakan secara keseluruhan.
*   [ ] Pengecekan *Build* Produksi (`npm run build`).
*   [ ] Penggajian ulang (Deployment) ke *Vercel* dengan *environment variables* (*database connection*) asli.

---

*Dibuat untuk panduan pengembangan Tahap 4 - Aplikasi Baitul Maal Ponpes Ar-Rosyad.*
