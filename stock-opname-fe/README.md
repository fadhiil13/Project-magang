# Stock Opname Aset TI — Frontend (stock-opname-fe)

Aplikasi web untuk pencatatan digital dan Berita Acara Stock Opname Aset Teknologi Informasi PT Kereta Api Indonesia (Persero). Dibangun dengan [Next.js](https://nextjs.org/) (App Router, Turbopack) + TypeScript + Tailwind CSS.

Frontend ini mengonsumsi API dari [`stock-opname-be`](../stock-opname-be) — **backend harus sudah jalan** sebelum frontend dijalankan. Lihat [README utama](../README.md) untuk gambaran sistem secara keseluruhan.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Struktur Folder](#struktur-folder)
- [Peta Halaman (Routing)](#peta-halaman-routing)
- [Komponen UI Dasar](#komponen-ui-dasar)
- [Alur Kerja Penting](#alur-kerja-penting)
- [Validasi Form](#validasi-form)
- [Troubleshooting](#troubleshooting)

## Fitur Utama

- **Login** dengan role `USER` dan `ADMIN`, token JWT tersimpan di `localStorage`
- **Dashboard** — kartu ringkasan (total Berita Acara, total aset, jumlah Business Area, BA bulan ini), status generate dokumen, breakdown aset per jenis, breakdown BA per Business Area (dengan paginasi 5 item/halaman), grafik tren BA per bulan (12 bulan, dipaginasi 6 bulan/halaman)
- **Berita Acara Stock Opname**
  - List dengan pencarian (No. Ref / Business Area) dan paginasi
  - Form **3 langkah**: Data Umum → Analisa & Data Aset → Tanda Tangan
  - **Smart lookup** — ketik Nomor Inventaris yang pernah tercatat, field Jenis/Merek/Serial Number otomatis terisi dari data terakhir
  - Tambah baris aset dinamis, field "Sumber Data" otomatis default `support.kai.id`
  - **Tanda tangan digital** — gambar langsung di canvas atau upload gambar, untuk tiga pihak: Pimpinan Unit Kerja, Pimpinan IT, Petugas Stock Opname
  - Setelah simpan, pilihan langsung generate dokumen atau lewati dulu (generate bisa kapan saja dari List/Detail)
  - Generate, download (PDF/DOCX), dan print langsung dari List maupun halaman Detail
- **Cari Aset** — cari riwayat penempatan aset lintas semua Berita Acara berdasarkan Nomor Inventaris/Serial Number, lengkap dengan histori lokasi
- **Kelola User** (khusus Admin) — tambah/edit/hapus akun
- **Layout adaptif** — sidebar collapsible (desktop) / drawer (mobile), judul halaman otomatis muncul di topbar sesuai halaman aktif, responsif di semua ukuran layar

## Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Framework | Next.js 16 | App Router, Turbopack sebagai bundler dev |
| Bahasa | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | Konfigurasi via `@theme` di `globals.css`, tanpa file config terpisah |
| Form & Validasi | react-hook-form + zod | Validasi skema-driven, error per-field otomatis |
| HTTP Client | axios | Instance custom dengan interceptor buat nyisipin token JWT |
| Ikon | lucide-react | |
| Notifikasi | react-hot-toast | Toast sukses/error di seluruh app |
| Tanda tangan | react-signature-canvas | Canvas gambar tangan buat tanda tangan digital |

## Instalasi

Prasyarat: Node.js 18+, npm, dan backend `stock-opname-be` sudah jalan.

```bash
npm install
```

## Konfigurasi Environment

Bikin file `.env.local` di root folder ini (opsional — kalau tidak diisi, otomatis fallback ke `http://localhost:3001`):

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Ganti sesuai URL backend kamu (misal kalau backend di-deploy ke server lain).

## Menjalankan Aplikasi

```bash
# Development — auto-reload, pakai Turbopack
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

```bash
# Build & jalankan versi production
npm run build
npm run start
```

## Struktur Folder

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — cuma bungkus <AuthProvider>
│   ├── page.tsx                     # Redirect otomatis ke /dashboard
│   ├── globals.css                  # Tailwind + custom theme (warna kai-navy, kai-orange, dll)
│   ├── login/
│   │   └── page.tsx                 # Halaman login (background gradient, form terpisah)
│   └── (protected)/                 # Route group — WAJIB login, dibungkus Sidebar+Topbar
│       ├── layout.tsx                # Cek auth, render Sidebar/Topbar, PageTitleProvider
│       ├── dashboard/page.tsx
│       ├── berita-acara/
│       │   ├── page.tsx              # List + search + paginasi
│       │   ├── create/page.tsx       # Wrapper form mode create
│       │   └── [id]/
│       │       ├── page.tsx          # Detail (lihat data, generate, download, hapus)
│       │       └── edit/page.tsx     # Wrapper form mode edit
│       ├── aset/search/page.tsx      # Cari Aset + riwayat
│       └── admin/users/page.tsx      # Kelola User (admin only, redirect kalau bukan admin)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # Nav utama, collapsible desktop / drawer mobile, info user + logout
│   │   ├── SidebarItem.tsx           # Satu item nav (auto-highlight kalau aktif)
│   │   └── Topbar.tsx                # Tombol toggle sidebar + judul halaman dari context
│   ├── form/
│   │   └── BeritaAcaraForm.tsx       # Form 3-step, dipakai bareng oleh create & edit
│   ├── dashboard/
│   │   ├── BarList.tsx               # Daftar horizontal bar chart (dengan paginasi)
│   │   └── MonthlyTrendChart.tsx     # Grafik batang vertikal tren bulanan (dengan paginasi)
│   ├── signature/
│   │   └── SignaturePad.tsx          # Canvas tanda tangan / upload gambar
│   └── ui/                           # Komponen dasar: Button, Card, Input, Select, Textarea,
│                                       # Modal, Badge, Pagination, Table, EmptyState, LoadingSpinner
│
├── lib/
│   ├── api.ts                        # Instance axios + interceptor token JWT
│   ├── auth.ts                       # AuthProvider (context) + useAuth() hook
│   ├── pageTitle.tsx                 # Context judul halaman — tiap page panggil usePageTitle()
│   ├── download.ts                   # Helper generateDocument/downloadDocument/printDocument
│   ├── schemas.ts                    # Skema validasi zod + daftar field per step form
│   └── constants.ts                  # API_BASE_URL, dll
│
├── hooks/
│   └── useDebounce.ts                # Debounce value (dipakai di search & smart lookup)
│
└── types/
    └── index.ts                      # Semua tipe TypeScript bersama (BeritaAcara, User, dll)
```

## Peta Halaman (Routing)

| Route | Auth | Deskripsi |
|---|---|---|
| `/login` | Publik | Form login |
| `/dashboard` | User | Statistik & ringkasan |
| `/berita-acara` | User | List Berita Acara |
| `/berita-acara/create` | User | Form buat baru |
| `/berita-acara/[id]` | User | Detail satu Berita Acara |
| `/berita-acara/[id]/edit` | User | Form edit |
| `/aset/search` | User | Cari Aset |
| `/admin/users` | **Admin** | Kelola User |

Semua route di dalam `(protected)/` otomatis redirect ke `/login` kalau belum login (dicek di `(protected)/layout.tsx` lewat `useAuth()`).

## Komponen UI Dasar

Folder `components/ui/` isinya komponen generik yang dipakai berulang di seluruh app — dibuat sendiri (bukan library UI eksternal) supaya gampang disesuaikan dengan identitas visual KAI (warna `kai-navy`, `kai-orange`, `kai-blue`):

| Komponen | Kegunaan |
|---|---|
| `Button` | Tombol dengan varian (primary/secondary/danger), state loading |
| `Card` | Container putih dengan border/shadow, opsional garis warna di kiri |
| `Input`, `Select`, `Textarea` | Form field dengan label & pesan error terintegrasi |
| `Modal` | Dialog konfirmasi (dipakai untuk hapus data) |
| `Badge` | Label kecil buat role (`USER`/`ADMIN`) |
| `Pagination` | Navigasi halaman untuk tabel/list |
| `Table` | Wrapper tabel dengan style konsisten |
| `EmptyState` | Tampilan "tidak ada data" dengan ikon |
| `LoadingSpinner` | Indikator loading |

## Alur Kerja Penting

### Autentikasi
Token JWT dari `/auth/login` disimpan di `localStorage`. Instance axios di `lib/api.ts` otomatis menyisipkan token itu ke header `Authorization` di setiap request lewat interceptor — jadi tidak perlu manual di tiap pemanggilan API.

### Judul Halaman Dinamis
Alih-alih tiap halaman bikin `<h1>` sendiri, tiap page component memanggil hook `usePageTitle("Judul Halaman")` (dari `lib/pageTitle.tsx`). `Topbar` membaca context ini dan otomatis menampilkan judul yang sesuai — konsisten di semua halaman tanpa duplikasi kode.

```tsx
export default function DashboardPage() {
  usePageTitle(`Selamat datang, ${user?.nama}!`, 'Ringkasan Stock Opname Aset TI');
  // ...
}
```

### Smart Lookup Aset
Saat mengetik Nomor Inventaris di form Berita Acara (step 2), setelah debounce 500ms aplikasi otomatis cari data aset itu di riwayat (`GET /aset/search`) — kalau ketemu, field Serial Number/Jenis/Merek langsung terisi otomatis, mempercepat entri data berulang.

### Generate & Download Dokumen
Setelah form disubmit (create/edit), user diberi pilihan lewat panel konfirmasi: generate dokumen sekarang, atau lewati dan generate nanti dari halaman List/Detail. Ini mencegah dokumen ter-generate dengan data yang belum lengkap (misal tanda tangan belum diisi).

## Validasi Form

Skema validasi didefinisikan di `lib/schemas.ts` pakai [zod](https://zod.dev/), dipasang ke `react-hook-form` lewat `@hookform/resolvers`. Form dipecah jadi 3 step, masing-masing punya daftar field yang divalidasi sebelum lanjut ke step berikutnya (`step1Fields`, `step2Fields` — didefinisikan di file yang sama).

## Troubleshooting

| Masalah | Penyebab Umum | Solusi |
|---|---|---|
| Halaman blank / komponen tidak berubah padahal sudah disave | Cache Turbopack basi | Stop dev server → hapus folder `.next` → `npm run dev` lagi |
| `Module not found: Can't resolve '@/components/...'` | Salah besar-kecil huruf nama file/import | Turbopack case-sensitive walau di Windows filesystem tidak — cek persis `Footer.tsx` vs `footer.tsx` |
| Klik tombol/link tidak ada respons sama sekali (tanpa error) | File halaman tujuan salah isi (ke-tuker konten) atau salah lokasi folder | Cek isi file di route tujuan — pastikan `export default function`-nya sesuai (misal `[id]/page.tsx` harus isi Detail, bukan List) |
| `Network Error` di console | Backend tidak jalan, atau `NEXT_PUBLIC_API_URL` salah | Pastikan `stock-opname-be` sedang jalan dan URL-nya benar |
| Layout `(protected)` dan root ketuker isinya | Dua file bernama sama (`layout.tsx`) di folder berbeda | Root (`app/layout.tsx`) cuma `<AuthProvider>`; isi Sidebar/Topbar/dll ada di `app/(protected)/layout.tsx` |

---

Dibuat oleh Fadhil Akbar Saputra — Divisi Sistem Informasi, PT Kereta Api Indonesia (Persero).
