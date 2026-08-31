# Stock Opname Aset TI — PT Kereta Api Indonesia (Persero)

Sistem digital pencatatan dan Berita Acara Stock Opname Aset Teknologi Informasi PT Kereta Api Indonesia (Persero). Menggantikan proses pencatatan manual (kertas/Excel) dengan aplikasi web terpusat: entri data aset, tanda tangan digital, sampai generate dokumen resmi (PDF & DOCX) sesuai format formulir standar KAI (`FR.SM/TI/011.010/04-2021`).

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Repository](#struktur-repository)
- [Fitur Utama](#fitur-utama)
- [Tech Stack Ringkas](#tech-stack-ringkas)
- [Quick Start](#quick-start)
- [Alur Penggunaan (End-to-End)](#alur-penggunaan-end-to-end)
- [Role & Hak Akses](#role--hak-akses)
- [Dokumentasi Lebih Lanjut](#dokumentasi-lebih-lanjut)
- [Troubleshooting Umum](#troubleshooting-umum)

## Gambaran Umum

Setiap kali dilakukan stock opname (pemeriksaan fisik) terhadap aset TI di suatu unit kerja, petugas mencatat data aset yang diperiksa, hasil analisa, dan tindak lanjut yang diperlukan lewat aplikasi ini. Setelah data lengkap dan ditandatangani secara digital oleh pihak-pihak terkait (Pimpinan Unit Kerja, Pimpinan IT, dan Petugas Stock Opname), sistem otomatis menghasilkan **Berita Acara** resmi dalam format PDF dan DOCX yang siap dicetak atau diarsipkan.

Sistem juga menyimpan **riwayat penempatan tiap aset** — jadi kalau suatu aset (dikenali dari Nomor Inventaris/Serial Number) pernah dicatat di Berita Acara sebelumnya, datanya bisa langsung ditelusuri atau bahkan otomatis terisi ulang saat dicatat lagi di BA baru.

## Arsitektur Sistem

Aplikasi ini terdiri dari dua bagian yang berjalan terpisah dan saling berkomunikasi lewat REST API:

```
┌─────────────────────┐         HTTP/JSON          ┌──────────────────────┐
│   stock-opname-fe    │ ◄────────────────────────► │   stock-opname-be     │
│   (Next.js, :3000)   │      (JWT di header)        │   (NestJS, :3001)     │
│                       │                              │                        │
│  - UI & routing       │                              │  - REST API            │
│  - Form & validasi     │                              │  - Auth (JWT)           │
│  - State management   │                              │  - Generate PDF/DOCX    │
└─────────────────────┘                              │  - Akses database        │
                                                        └───────────┬───────────┘
                                                                    │
                                                                    ▼
                                                          ┌──────────────────┐
                                                          │   MySQL Database   │
                                                          │  (data + file blob)│
                                                          └──────────────────┘
```

- **Frontend** (`stock-opname-fe`) — aplikasi Next.js yang di-render di browser, menangani seluruh tampilan dan interaksi pengguna. Tidak menyimpan data apa pun secara permanen — semua lewat API ke backend.
- **Backend** (`stock-opname-be`) — REST API NestJS yang menangani autentikasi, validasi, logic bisnis, generate dokumen, dan satu-satunya pihak yang bicara langsung ke database.
- **Database** — MySQL tunggal, termasuk menyimpan **file PDF/DOCX hasil generate langsung sebagai blob** (bukan di cloud storage terpisah), jadi seluruh sistem tidak bergantung pada layanan pihak ketiga berbayar.

## Struktur Repository

```
Project-magang/
├── stock-opname-be/     # Backend — NestJS REST API (lihat README di dalamnya)
├── stock-opname-fe/     # Frontend — Next.js web app (lihat README di dalamnya)
└── README.md            # File ini — overview keseluruhan sistem
```

Kedua folder adalah proyek independen (masing-masing punya `package.json`, `node_modules`, dan proses jalan sendiri) yang digabung dalam satu repository Git untuk kemudahan pengembangan.

## Fitur Utama

| Fitur | Keterangan |
|---|---|
| **Login berbasis role** | `USER` (petugas) dan `ADMIN` (akses penuh + kelola user) |
| **CRUD Berita Acara** | Data umum, analisa & tindak lanjut, daftar aset TI di dalamnya |
| **Form 3 langkah** | Data Umum → Analisa & Data Aset → Tanda Tangan, dengan validasi per langkah |
| **Smart lookup aset** | Nomor inventaris yang pernah tercatat otomatis mengisi field lain |
| **Tanda tangan digital** | Gambar tangan (canvas) atau upload, untuk 3 pihak penandatangan |
| **Generate dokumen** | PDF (Puppeteer) dan DOCX (edit template Word langsung), tersimpan di database |
| **Cari Aset & Riwayat** | Telusuri histori penempatan satu aset lintas semua Berita Acara |
| **Dashboard statistik** | Ringkasan total data, breakdown per jenis/area, tren bulanan |
| **Kelola User** | Tambah/edit/hapus akun (khusus Admin) |

## Tech Stack Ringkas

| | Backend | Frontend |
|---|---|---|
| Framework | NestJS 11 | Next.js 16 (App Router) |
| Bahasa | TypeScript | TypeScript |
| Database/ORM | MySQL + Prisma 6 | – |
| Auth | JWT (Passport) + bcrypt | Simpan token di `localStorage` |
| Styling | – | Tailwind CSS v4 |
| Form | class-validator (DTO) | react-hook-form + zod |
| Dokumen | Puppeteer (PDF), XML manual (DOCX) | – |

Detail lengkap tiap sisi ada di README masing-masing folder.

## Quick Start

Jalankan **backend dulu**, baru **frontend** (frontend butuh backend untuk berfungsi).

### 1. Backend

```bash
cd stock-opname-be
npm install
# bikin file .env — lihat stock-opname-be/README.md untuk detail lengkap
npx prisma migrate dev
npx prisma generate
npx prisma db seed        # opsional, bikin akun admin awal
npm run start:dev
```

Backend jalan di `http://localhost:3001` (Swagger docs: `http://localhost:3001/api/docs`).

### 2. Frontend

Di terminal terpisah:

```bash
cd stock-opname-fe
npm install
# opsional: bikin .env.local kalau backend tidak di localhost:3001
npm run dev
```

Frontend jalan di `http://localhost:3000`.

### 3. Login

Buka `http://localhost:3000/login`, masuk dengan akun admin hasil seed (default `admin` / `admin123`, atau sesuai `.env` backend) — **segera ganti password** setelah login pertama.

📖 Instruksi setup lebih detail (termasuk semua environment variable) ada di:
- [`stock-opname-be/README.md`](./stock-opname-be/README.md)
- [`stock-opname-fe/README.md`](./stock-opname-fe/README.md)

## Alur Penggunaan (End-to-End)

1. **Login** — petugas masuk dengan akun masing-masing.
2. **Buat Berita Acara baru** — isi form 3 langkah: data umum (No. Ref, tanggal, unit kerja, dst), analisa & daftar aset yang diperiksa, lalu tanda tangan digital ketiga pihak.
3. **Simpan** — data tersimpan; sistem menawarkan generate dokumen langsung atau nanti.
4. **Generate** — sistem membuat PDF & DOCX sesuai format resmi, tersimpan di database.
5. **Download / Print** — dokumen bisa diunduh (PDF/DOCX) atau langsung diprint dari halaman List maupun Detail.
6. **Cari Aset** (kapan saja) — telusuri riwayat penempatan suatu aset lewat Nomor Inventaris/Serial Number lintas semua Berita Acara yang pernah dibuat.

## Role & Hak Akses

| Aksi | USER | ADMIN |
|---|---|---|
| Lihat/buat/edit Berita Acara miliknya sendiri | ✅ | ✅ |
| Lihat/edit Berita Acara milik user lain | ❌ | ✅ |
| Hapus Berita Acara | ❌ | ✅ |
| Generate & download dokumen | ✅ | ✅ |
| Kelola akun user (tambah/edit/hapus) | ❌ | ✅ |
| Lihat Dashboard & Cari Aset | ✅ | ✅ |

## Dokumentasi Lebih Lanjut

- **Backend** — arsitektur modul, skema database lengkap, daftar endpoint API, penjelasan teknis generate PDF/DOCX: [`stock-opname-be/README.md`](./stock-opname-be/README.md)
- **Frontend** — struktur folder, peta halaman, komponen UI, alur kerja form: [`stock-opname-fe/README.md`](./stock-opname-fe/README.md)
- **API interaktif (Swagger)** — begitu backend jalan, buka `http://localhost:3001/api/docs`

## Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| Frontend menampilkan `Network Error` | Pastikan backend sudah jalan di port yang sesuai `NEXT_PUBLIC_API_URL` |
| `EADDRINUSE` saat start backend/frontend | Ada proses lama masih pegang port — matikan dulu (`taskkill /F /IM node.exe` di Windows) |
| Halaman frontend blank/tidak update padahal sudah edit kode | Hapus folder `.next` di `stock-opname-fe`, restart `npm run dev` |
| Login gagal padahal kredensial benar | Pastikan sudah jalankan `npx prisma db seed` dan database sudah ke-migrate |

Masalah spesifik backend/frontend, lihat bagian Troubleshooting di README masing-masing folder.

---

**PT Kereta Api Indonesia (Persero)** — Divisi Sistem Informasi
Dibuat oleh **Fadhil Akbar Saputra**
