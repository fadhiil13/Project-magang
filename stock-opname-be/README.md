# Stock Opname Aset TI — Backend (stock-opname-be)

REST API untuk sistem digital pencatatan dan Berita Acara Stock Opname Aset Teknologi Informasi PT Kereta Api Indonesia (Persero). Dibangun dengan [NestJS](https://nestjs.com/) di atas [Prisma ORM](https://www.prisma.io/) dan MySQL.

Bagian dari monorepo `Project-magang` — lihat [README utama](../README.md) untuk gambaran sistem secara keseluruhan (backend + frontend).

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur & Alur Data](#arsitektur--alur-data)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Setup Database](#setup-database)
- [Menjalankan Server](#menjalankan-server)
- [Struktur Folder](#struktur-folder)
- [Model Data (Skema Database)](#model-data-skema-database)
- [Autentikasi & Otorisasi](#autentikasi--otorisasi)
- [Endpoint API Lengkap](#endpoint-api-lengkap)
- [Generate Dokumen (PDF & DOCX)](#generate-dokumen-pdf--docx)
- [Catatan Teknis Penting](#catatan-teknis-penting)
- [Troubleshooting](#troubleshooting)

## Fitur Utama

- **Autentikasi JWT** dengan dua role: `USER` (petugas biasa, hanya bisa kelola Berita Acara miliknya sendiri) dan `ADMIN` (akses penuh, termasuk hapus data dan kelola user)
- **CRUD Berita Acara Stock Opname** — data umum, analisa & tindak lanjut, daftar baris aset TI di dalamnya (relasi one-to-many, cascade delete)
- **Generate dokumen otomatis** dalam dua format sekaligus:
  - **PDF** — dirender dari HTML/CSS custom via Puppeteer (Chromium headless), tampilan bisa dikontrol presisi
  - **DOCX** — hasil edit langsung terhadap file `template.docx` asli (unzip → edit XML → rezip), jadi tetap bisa dibuka & diedit manual di Microsoft Word
  - Kedua file disimpan sebagai `LONGBLOB` langsung di kolom database — tidak butuh layanan cloud storage pihak ketiga (gratis, tidak ada dependency eksternal)
- **Tanda tangan digital** (base64 PNG) untuk tiga pihak: Pimpinan Unit Kerja, Pimpinan IT, dan Petugas Stock Opname — masing-masing dengan nama, jabatan, dan NIP
- **Smart lookup aset** — pencarian aset berdasarkan Nomor Inventaris/Serial Number lintas semua Berita Acara, termasuk riwayat penempatannya
- **Statistik Dashboard** — agregasi data: breakdown aset per jenis, Berita Acara per Business Area, tren jumlah BA per bulan (12 bulan terakhir), status generate dokumen (sudah/belum)
- **Manajemen User** (khusus Admin) — create, update, delete akun

## Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | NestJS 11 | Arsitektur modular (Module–Controller–Service) |
| Database | MySQL | Diakses lewat Prisma ORM 6 |
| ORM | Prisma | Migration, query builder, type-safety otomatis dari skema |
| Auth | Passport JWT + bcrypt | Token JWT, password di-hash dengan bcrypt |
| Generate PDF | Puppeteer | Render HTML ke PDF pakai Chromium headless beneran |
| Generate DOCX | Manipulasi XML manual | `unzip` → replace teks/gambar dalam XML → `zip` ulang jadi `.docx` |
| Validasi | class-validator, class-transformer | Validasi otomatis lewat DTO + decorator |
| API Docs | Swagger (`@nestjs/swagger`) | Auto-generate dari decorator di controller/DTO |

## Arsitektur & Alur Data

```
Client (Next.js) → HTTP Request (JWT di header Authorization)
                       │
                       ▼
              JwtAuthGuard (validasi token)
                       │
                       ▼
              RolesGuard (cek role USER/ADMIN, kalau route butuh)
                       │
                       ▼
                  Controller → Service → Prisma → MySQL
                       │
                       ▼
              Response JSON (atau file Buffer utk download)
```

Setiap modul (`auth`, `users`, `berita-acara`, `aset`, `document`) berdiri sendiri dengan pola NestJS standar: `*.module.ts` mendaftarkan provider, `*.controller.ts` menangani routing HTTP, `*.service.ts` isi logic bisnis & akses Prisma.

## Instalasi

Prasyarat: Node.js 18+, npm, dan MySQL server yang sudah jalan (lokal atau remote).

```bash
npm install
```

## Konfigurasi Environment

Bikin file `.env` di root folder ini:

```env
# Koneksi database MySQL — format: mysql://user:password@host:port/nama_database
DATABASE_URL="mysql://root:password@localhost:3306/stock_opname_kai"

# Rahasia buat sign & verifikasi JWT — WAJIB diganti, jangan pakai contoh ini di production
JWT_SECRET="ganti-dengan-string-acak-yang-panjang-dan-aman"
JWT_EXPIRES_IN="7d"

# Port server (opsional, default 3001)
PORT=3001

# Origin frontend yang diizinkan CORS, pisah koma kalau lebih dari satu (opsional)
FRONTEND_URL="http://localhost:3000"

# Kredensial admin awal buat `npx prisma db seed` (opsional, ada default kalau kosong)
SEED_ADMIN_USERNAME="admin"
SEED_ADMIN_PASSWORD="admin123"
SEED_ADMIN_NAMA="Administrator"
```

> ⚠️ **Jangan pernah commit file `.env`** ke Git. Sudah masuk `.gitignore`, tapi selalu cek `git status` sebelum `git add .` untuk mastiin.

## Setup Database

```bash
# 1. Jalankan semua migration (bikin/update tabel sesuai prisma/schema.prisma)
npx prisma migrate dev

# 2. Generate Prisma Client (bikin tipe TypeScript dari skema, wajib tiap kali schema berubah)
npx prisma generate

# 3. (Opsional) Bikin akun admin pertama
npx prisma db seed
```

Kalau `npx prisma generate` gagal dengan error `EPERM`/file locked di Windows: tutup semua terminal yang masih menjalankan `npm run start:dev`, lalu ulangi.

Login pertama pakai kredensial dari `.env` (default `admin` / `admin123`) lewat endpoint `/auth/login` — **segera ganti password** setelah itu.

## Menjalankan Server

```bash
# Development — auto-reload tiap ada perubahan file
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server default jalan di `http://localhost:3001`. Dokumentasi API interaktif (Swagger) otomatis tersedia di `http://localhost:3001/api/docs` — bisa langsung dicoba dari browser (klik "Authorize" dan masukkan token JWT dari `/auth/login`).

## Struktur Folder

```
src/
├── main.ts                    # Entry point — CORS, body limit, ValidationPipe, Swagger
├── app.module.ts              # Root module, daftarin semua module lain
├── prisma/
│   └── prisma.service.ts      # Wrapper PrismaClient sebagai injectable service
├── auth/
│   ├── auth.controller.ts     # POST /auth/login, /auth/register
│   ├── auth.service.ts        # Verifikasi password, terbitkan JWT
│   ├── jwt.strategy.ts        # Passport strategy, validasi token dari header
│   ├── jwt-auth.guard.ts      # Guard: wajib login
│   ├── roles.guard.ts         # Guard: wajib role tertentu (dipasang bareng @Roles())
│   └── roles.decorator.ts     # @Roles(Role.ADMIN) — dekorator buat proteksi route
├── users/                     # CRUD user (admin only)
├── berita-acara/
│   ├── berita-acara.controller.ts
│   ├── berita-acara.service.ts   # Logic utama: create/update/delete/statistics
│   └── dto/                       # Validasi request body
├── aset/
│   ├── aset.controller.ts
│   └── aset.service.ts        # Search & riwayat aset lintas Berita Acara
├── document/
│   ├── document.service.ts    # Generate PDF (Puppeteer) & DOCX (edit XML)
│   └── templates/
│       ├── template.docx      # Template Word asli
│       ├── kai-logo.png       # Logo KAI (dipakai di header PDF)
│       └── terbatas.png       # Badge "TERBATAS" (opsional, fallback ke teks kalau tidak ada)
└── (folder storage/ sudah dihapus — dulu untuk Cloudinary, sekarang file disimpan di DB)

prisma/
├── schema.prisma              # Sumber kebenaran skema database
├── migrations/                 # Riwayat migration (jangan diedit manual)
└── seed.ts                    # Script bikin admin awal
```

## Model Data (Skema Database)

**`User`** — akun login
| Field | Tipe | Keterangan |
|---|---|---|
| `username` | String (unique) | |
| `password` | String | Di-hash bcrypt |
| `nama` | String | |
| `role` | `USER` \| `ADMIN` | Default `USER` |

**`BeritaAcara`** — dokumen utama
| Field | Tipe | Keterangan |
|---|---|---|
| `noRef` | String (unique) | Nomor referensi BA |
| `tanggal` | Date | Disimpan sebagai `DATE` murni (tanpa jam) supaya tidak bergeser akibat konversi timezone WIB↔UTC |
| `businessArea`, `unitKerja`, `tempatKedudukan` | String | |
| `analisa`, `tindakLanjut` | Text | |
| `ttd*` (3 pihak) | LongText | Base64 data URI gambar tanda tangan |
| `nama*`, `nip*`, `jabatan*` (3 pihak) | String | Data penandatangan |
| `pdfData`, `docxData` | Bytes (LongBlob) | File hasil generate, disimpan langsung di DB |
| `hasDocument` | Boolean | Penanda ringan "sudah pernah digenerate", dipakai di list biar tidak perlu fetch blob besar |
| `dokumenStale` | Boolean | `true` kalau data diedit setelah generate terakhir (dokumen lama sudah tidak akurat) |
| `userId` | Int (FK → User) | Pembuat BA |

**`AsetRow`** — baris aset di dalam satu Berita Acara (relasi many-to-one, `onDelete: Cascade`)
| Field | Tipe | Keterangan |
|---|---|---|
| `nomorUrut` | Int | Urutan tampil di tabel |
| `nomorInventaris`, `serialNumber` | String | Diindex — dipakai untuk fitur Cari Aset |
| `jenisAset`, `merek` | String | Teks bebas |
| `sumberData`, `keterangan` | String | Opsional, default string kosong |

## Autentikasi & Otorisasi

- Login (`POST /auth/login`) mengembalikan JWT yang harus disertakan di setiap request selanjutnya via header `Authorization: Bearer <token>`.
- `JwtAuthGuard` dipasang global-ish di route yang butuh login — menolak request tanpa token valid dengan `401 Unauthorized`.
- `RolesGuard` + dekorator `@Roles(Role.ADMIN)` dipasang di route yang butuh role spesifik (misal hapus Berita Acara, kelola user) — menolak dengan `403 Forbidden` kalau role tidak cocok.
- Role `USER` hanya bisa melihat/mengedit Berita Acara miliknya sendiri; `ADMIN` bisa akses semua data.

## Endpoint API Lengkap

### Auth
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | – | `{ username, password }` → `{ access_token, user }` |
| POST | `/auth/register` | – | Registrasi user baru |

### Berita Acara
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/berita-acara` | User | List dengan query `page`, `limit`, `search` |
| POST | `/berita-acara` | User | Buat baru beserta baris aset |
| GET | `/berita-acara/statistics` | User | Data agregasi untuk Dashboard |
| GET | `/berita-acara/:id` | User | Detail satu BA + baris aset |
| PATCH | `/berita-acara/:id` | User (pemilik) | Update data; otomatis set `dokumenStale = true` |
| DELETE | `/berita-acara/:id` | **Admin** | Hapus BA (cascade hapus baris aset) |
| POST | `/berita-acara/:id/generate` | User | Generate ulang PDF & DOCX, simpan ke DB |
| GET | `/berita-acara/:id/download/:format` | User | Download; `:format` = `pdf` atau `docx` |

### Aset
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/aset/search?q=` | User | Cari aset by nomor inventaris/serial (substring match) |
| GET | `/aset/:nomorInventaris/history` | User | Riwayat aset ini di semua Berita Acara |

### Users (Admin only)
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/users` | List semua user |
| GET | `/users/:id` | Detail user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Hapus user |

Skema request/response lengkap (termasuk contoh body) ada di Swagger docs (`/api/docs`) begitu server jalan — auto-generate dari decorator `@ApiProperty` di tiap DTO.

## Generate Dokumen (PDF & DOCX)

### PDF (`document.service.ts` → `generatePdf`)
1. Data BA dirender jadi HTML+CSS custom (meniru layout formulir resmi KAI).
2. Puppeteer buka HTML itu di Chromium headless, ukur tinggi elemen (misal box Analisa vs Tindak Lanjut disamakan tingginya biar seimbang secara visual), lalu export ke PDF.
3. Logo KAI dan badge "TERBATAS" diambil dari `templates/kai-logo.png` dan `templates/terbatas.png` — kalau file tidak ada, otomatis fallback ke teks.

### DOCX (`document.service.ts` → `generateDocx`)
1. `template.docx` di-unzip (file `.docx` sebenarnya adalah ZIP berisi file XML).
2. XML-nya (`document.xml`, `header1.xml`, `header2.xml`, `footer1.xml`) diedit langsung untuk menyisipkan data — **bukan** pakai regex teks mentah, karena Word sering memecah satu kalimat jadi banyak `<w:t>` run terpisah akibat fitur spell-check, sehingga pencarian teks polos gampang gagal. Kode ini menavigasi struktur XML (posisi paragraf, tabel, cell) supaya tetap akurat walau teksnya terpecah.
3. Folder hasil edit di-zip ulang jadi `.docx`.
4. Di **Windows**, proses unzip/zip pakai PowerShell (`Expand-Archive`/`Compress-Archive`) yang secara khusus hanya mau bekerja dengan ekstensi `.zip` — makanya ada langkah rename sementara `.docx` → `.zip` dan sebaliknya di dalam kode.
5. Di Linux/Mac, proses ini pakai command `zip`/`unzip` biasa.

Kedua proses menghasilkan `Buffer` yang langsung disimpan ke kolom `pdfData`/`docxData` di database — tidak ada file sementara yang tersisa di server.

## Catatan Teknis Penting

- **Body limit dinaikkan ke 10MB** (`main.ts`) — default Express cuma 100KB, sedangkan tanda tangan base64 (apalagi tiga sekaligus) gampang melebihi itu.
- **`ValidationPipe` global** dengan `whitelist: true` — field yang tidak didefinisikan di DTO otomatis dibuang dari request, mencegah data sampah masuk ke database.
- **Index database** dipasang di kolom yang sering dipakai untuk filter/pencarian: `userId`, `tanggal`, `businessArea` di `BeritaAcara`; `nomorInventaris`, `serialNumber` di `AsetRow`.
- **`hasDocument`** sengaja dipisah dari `pdfData`/`docxData` supaya endpoint list (`GET /berita-acara`) tidak perlu fetch kolom blob yang berat — cukup select boolean-nya saja untuk menentukan tombol Download vs Generate di frontend.

## Troubleshooting

| Masalah | Penyebab | Solusi |
|---|---|---|
| `EADDRINUSE: address already in use :::3001` | Proses Node lama masih pegang port | Windows: `netstat -ano \| findstr :3001` lalu `taskkill /PID <pid> /F`, atau paksa semua: `taskkill /F /IM node.exe` |
| `EPERM` saat `prisma generate` | File Prisma Client sedang dipakai proses lain (biasanya `start:dev` masih jalan) | Stop semua proses Node dulu, baru ulangi |
| Generate DOCX gagal di Windows (`Compress-Archive` error) | PowerShell hanya mau ekstensi `.zip` | Pastikan pakai versi `document.service.ts` terbaru — sudah ada langkah rename otomatis |
| Field tanda tangan gagal disimpan (`Data too long for column`) | Kolom masih `VARCHAR(191)` bukan `LONGTEXT` | Jalankan ulang `npx prisma migrate dev` untuk apply migration terbaru |
| Field data hasil update tidak lengkap di DOCX (No.Ref, Tanggal, dll kosong) | Placeholder di template.docx terpecah jadi banyak run XML | Sudah diperbaiki di `document.service.ts` versi terbaru (navigasi struktur XML, bukan regex teks) |

---

Dibuat oleh Fadhil Akbar Saputra — Divisi Sistem Informasi, PT Kereta Api Indonesia (Persero).
