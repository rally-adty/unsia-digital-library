# Secure UNSIA Digital Library Dashboard

Aplikasi web full-stack untuk mengelola koleksi buku, anggota, dan transaksi peminjaman
UNSIA Digital Library, lengkap dengan autentikasi JWT dan dashboard visual.

**Tumpukan teknologi:** Node.js · Express.js · MongoDB + Mongoose · React.js (Vite) · Chart.js

---

## Daftar Isi

- [Fitur](#fitur)
- [Struktur Folder](#struktur-folder)
- [Kebutuhan Sistem](#kebutuhan-sistem)
- [Cara Menjalankan Secara Lokal](#cara-menjalankan-secara-lokal)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Akun Uji](#akun-uji)
- [Model Data](#model-data)
- [Daftar Endpoint API](#daftar-endpoint-api)
- [Contoh Request & Response](#contoh-request--response)
- [Penerapan Keamanan](#penerapan-keamanan)
- [Deployment](#deployment)

---

## Fitur

**Backend**
- REST API modular: `routes` → `controllers` → `models`, dengan `middleware` dan `config` terpisah.
- Empat model: `User`, `Book`, `Member`, `Loan`, dengan relasi `Loan → Book` dan `Loan → Member`.
- Register & login; password di-hash dengan **bcryptjs** (salt 10 putaran).
- Autentikasi **JWT** lewat header `Authorization: Bearer <token>`.
- Seluruh endpoint data dilindungi middleware `protect`, kecuali register dan login.
- CRUD penuh untuk Buku, Anggota, dan Peminjaman.
- Validasi input dengan **express-validator** pada semua endpoint tulis.
- Respons JSON konsisten dengan status HTTP yang tepat (200/201/400/401/403/404/409/500).
- Keamanan dasar: **Helmet**, **CORS** berdaftar-izin, **dotenv**, dan error handler global.

**Logika bisnis**
- Stok tersedia berkurang otomatis saat buku dipinjam dan pulih saat dikembalikan.
- Buku dengan peminjaman aktif tidak dapat dihapus; begitu pula anggotanya.
- Anggota berstatus nonaktif tidak dapat meminjam.
- Peminjaman ganda atas buku yang sama oleh anggota yang sama ditolak.
- Stok tidak boleh diturunkan di bawah jumlah yang sedang dipinjam.

**Frontend**
- Halaman: Login, Register, Dashboard, Data Buku, Data Anggota, Peminjaman, dan Not Found (404).
- Routing dengan React Router; protected route memverifikasi token ke backend saat halaman dimuat.
- Token disimpan di `localStorage`, otomatis disisipkan Axios, dan dibersihkan saat logout
  atau saat backend membalas 401.
- Tabel data dengan pencarian, form tambah/edit dalam modal, hapus dengan konfirmasi.
- Dashboard: 4 kartu ringkasan utama + 4 kartu pendukung, dan 3 grafik Chart.js.
- Tata letak responsif (sidebar menjadi menu geser pada layar kecil).

---

## Struktur Folder

```
unsia-digital-library/
├── docker-compose.yml          # MongoDB lokal untuk pengembangan
├── README.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js           # titik masuk: koneksi DB lalu listen
│       ├── app.js              # instansiasi Express, middleware, routing
│       ├── seed.js             # pengisian data contoh
│       ├── config/
│       │   ├── env.js          # pemuatan & validasi variabel lingkungan
│       │   └── db.js           # koneksi Mongoose
│       ├── models/
│       │   ├── User.js
│       │   ├── Book.js
│       │   ├── Member.js
│       │   └── Loan.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── bookController.js
│       │   ├── memberController.js
│       │   ├── loanController.js
│       │   └── dashboardController.js
│       ├── routes/
│       │   ├── index.js
│       │   ├── authRoutes.js
│       │   ├── bookRoutes.js
│       │   ├── memberRoutes.js
│       │   ├── loanRoutes.js
│       │   └── dashboardRoutes.js
│       ├── middleware/
│       │   ├── auth.js         # protect (JWT) & authorize (peran)
│       │   ├── validate.js     # perangkum hasil express-validator
│       │   ├── notFound.js     # 404 untuk route tak dikenal
│       │   └── errorHandler.js # penanganan error global
│       └── utils/
│           ├── ApiError.js
│           └── asyncHandler.js
└── frontend/
    ├── .env.example
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx             # definisi seluruh route
        ├── api/
        │   ├── client.js       # instans Axios + interceptor token
        │   └── services.js     # pembungkus tiap endpoint
        ├── context/
        │   └── AuthContext.jsx # status login global
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── Modal.jsx
        │   ├── Alert.jsx
        │   └── Loader.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Books.jsx
        │   ├── Members.jsx
        │   ├── Loans.jsx
        │   └── NotFound.jsx
        └── styles/
            └── global.css
```

---

## Kebutuhan Sistem

- Node.js 18 atau lebih baru (diuji pada Node 24)
- MongoDB — salah satu dari:
  - Docker Desktop (memakai `docker-compose.yml` yang tersedia), **atau**
  - MongoDB Community Server lokal, **atau**
  - MongoDB Atlas (gratis)

---

## Cara Menjalankan Secara Lokal

### 1. Siapkan MongoDB

**Opsi A — Docker (paling cepat):**

```bash
docker compose up -d
```

MongoDB akan berjalan di `localhost:27017` dengan kredensial `unsia` / `unsia_secret`.

**Opsi B — MongoDB Atlas:** buat cluster gratis, buat database user, izinkan akses IP Anda,
lalu salin connection string-nya untuk dipakai pada langkah berikutnya.

### 2. Jalankan backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Buka `backend/.env`, isi `JWT_SECRET` dengan teks acak yang panjang, dan sesuaikan
`MONGO_URI` bila memakai Atlas. Lalu:

```bash
npm run seed                # opsional: isi data contoh
npm run dev                 # atau: npm start
```

Backend berjalan di `http://localhost:5000`. Cek dengan membuka
`http://localhost:5000/api/health`.

### 3. Jalankan frontend

Di terminal terpisah:

```bash
cd frontend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Buka alamat tersebut di browser dan
masuk dengan akun uji di bawah.

> Bila `npm install` di frontend memunculkan peringatan `allow-scripts` (npm 11+),
> jalankan `npm rebuild esbuild` agar Vite dapat berjalan.

### 4. Build produksi frontend

```bash
cd frontend
npm run build               # hasil di folder dist/
npm run preview             # meninjau hasil build
```

---

## Variabel Lingkungan

### `backend/.env`

| Variabel | Wajib | Keterangan |
|---|---|---|
| `PORT` | tidak | Port server Express (bawaan `5000`) |
| `NODE_ENV` | tidak | `development` atau `production` |
| `MONGO_URI` | **ya** | Connection string MongoDB |
| `JWT_SECRET` | **ya** | Kunci penandatanganan JWT — ganti dengan teks acak panjang |
| `JWT_EXPIRES_IN` | tidak | Masa berlaku token (bawaan `1d`) |
| `CORS_ORIGIN` | tidak | Origin frontend yang diizinkan, dipisah koma |

Server sengaja berhenti saat start bila `MONGO_URI` atau `JWT_SECRET` kosong,
agar aplikasi tidak pernah berjalan tanpa rahasia.

### `frontend/.env`

| Variabel | Keterangan |
|---|---|
| `VITE_API_URL` | Alamat REST API backend, mis. `http://localhost:5000/api` |

Berkas `.env` asli tidak ikut di-commit (lihat `.gitignore`); yang disertakan hanya `.env.example`.

---

## Akun Uji

Tersedia setelah menjalankan `npm run seed`:

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@unsia.ac.id` | `admin123` |
| Petugas | `petugas@unsia.ac.id` | `petugas123` |

Seeder mengisi 10 buku, 6 anggota, dan 12 transaksi peminjaman yang tersebar
pada beberapa bulan terakhir, sehingga grafik dashboard langsung berisi.

> `npm run seed` **mengosongkan** seluruh koleksi lebih dulu. Jangan dijalankan
> terhadap database yang berisi data sungguhan.

---

## Model Data

### User

| Field | Tipe | Keterangan |
|---|---|---|
| `name` | String | wajib, 3–80 karakter |
| `email` | String | wajib, unik, huruf kecil |
| `password` | String | wajib, min. 6 karakter, di-hash, `select: false` |
| `role` | String | `admin` \| `petugas` (bawaan `petugas`) |
| `createdAt` / `updatedAt` | Date | otomatis |

### Book

| Field | Tipe | Keterangan |
|---|---|---|
| `title` | String | wajib |
| `author` | String | wajib |
| `category` | String | wajib, ter-index |
| `isbn` | String | wajib, unik |
| `publisher` | String | opsional |
| `year` | Number | 1500 s.d. tahun berjalan + 1 |
| `stock` | Number | wajib, ≥ 0 — total eksemplar |
| `available` | Number | ≥ 0 — eksemplar yang belum dipinjam |
| `createdBy` | ObjectId → User | pencatat data |

### Member

| Field | Tipe | Keterangan |
|---|---|---|
| `memberCode` | String | wajib, unik, huruf besar |
| `name` | String | wajib |
| `email` | String | wajib, unik |
| `phone` | String | opsional |
| `faculty` | String | opsional |
| `status` | String | `aktif` \| `nonaktif` |

### Loan

| Field | Tipe | Keterangan |
|---|---|---|
| `book` | ObjectId → Book | wajib (relasi) |
| `member` | ObjectId → Member | wajib (relasi) |
| `loanDate` | Date | bawaan waktu pencatatan |
| `dueDate` | Date | wajib, harus setelah hari ini |
| `returnDate` | Date | terisi saat dikembalikan |
| `status` | String | `dipinjam` \| `dikembalikan` |
| `note` | String | opsional, maks. 200 karakter |
| `handledBy` | ObjectId → User | petugas yang melayani |
| `isOverdue` | virtual | `true` bila masih dipinjam dan lewat jatuh tempo |

---

## Daftar Endpoint API

Prefiks: `/api`

| Method | Endpoint | Fungsi | Akses |
|---|---|---|---|
| GET | `/health` | Cek status API | Public |
| POST | `/auth/register` | Registrasi pengguna baru | Public |
| POST | `/auth/login` | Login dan memperoleh JWT | Public |
| GET | `/auth/me` | Profil pengguna aktif | Protected |
| GET | `/books` | Daftar buku (`search`, `category`, `page`, `limit`) | Protected |
| GET | `/books/:id` | Detail satu buku | Protected |
| POST | `/books` | Menambahkan buku | Protected |
| PUT | `/books/:id` | Memperbarui buku | Protected |
| DELETE | `/books/:id` | Menghapus buku | Protected |
| GET | `/members` | Daftar anggota (`search`, `status`) | Protected |
| GET | `/members/:id` | Detail satu anggota | Protected |
| POST | `/members` | Menambahkan anggota | Protected |
| PUT | `/members/:id` | Memperbarui anggota | Protected |
| DELETE | `/members/:id` | Menghapus anggota | Protected |
| GET | `/loans` | Daftar peminjaman (`status`, `member`, `book`) | Protected |
| GET | `/loans/:id` | Detail satu peminjaman | Protected |
| POST | `/loans` | Mencatat peminjaman baru | Protected |
| PUT | `/loans/:id/return` | Menandai buku dikembalikan | Protected |
| DELETE | `/loans/:id` | Menghapus data peminjaman | Protected |
| GET | `/dashboard/summary` | Ringkasan & data grafik dashboard | Protected |

### Bentuk respons

Berhasil:

```json
{ "success": true, "message": "...", "data": { }, "meta": { } }
```

Gagal:

```json
{ "success": false, "message": "Validasi input gagal", "errors": [{ "field": "isbn", "message": "ISBN harus 5-20 karakter" }] }
```

Status yang dipakai: `200` berhasil · `201` dibuat · `400` validasi/aturan bisnis ·
`401` belum/tidak terautentikasi · `403` peran tidak berwenang · `404` tidak ditemukan ·
`409` data duplikat · `500` kesalahan server.

---

## Contoh Request & Response

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@unsia.ac.id", "password": "admin123" }
```

```json
200 OK
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": { "id": "6a81...", "name": "Admin Perpustakaan", "email": "admin@unsia.ac.id", "role": "admin" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Login gagal**

```json
401 Unauthorized
{ "success": false, "message": "Email atau password salah" }
```

**Menambah buku**

```http
POST /api/books
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "Pemrograman Web Lanjut", "author": "Abdul Kadir", "category": "Informatika",
  "isbn": "9789792977820", "publisher": "Andi", "year": 2020, "stock": 5 }
```

```json
201 Created
{ "success": true, "message": "Buku berhasil ditambahkan", "data": { "_id": "...", "available": 5, ... } }
```

**Akses tanpa token**

```json
401 Unauthorized
{ "success": false, "message": "Akses ditolak, token tidak disertakan" }
```

**Mencatat peminjaman**

```http
POST /api/loans
Authorization: Bearer <token>

{ "book": "<bookId>", "member": "<memberId>", "dueDate": "2026-09-01T23:59:59.000Z" }
```

```json
201 Created
{ "success": true, "message": "Peminjaman berhasil dicatat",
  "data": { "status": "dipinjam", "book": { "title": "..." }, "member": { "name": "..." } } }
```

**Pengembalian**

```http
PUT /api/loans/<loanId>/return
Authorization: Bearer <token>
```

```json
200 OK
{ "success": true, "message": "Buku berhasil dikembalikan",
  "data": { "status": "dikembalikan", "returnDate": "2026-08-16T..." } }
```

**Ringkasan dashboard**

```json
200 OK
{
  "success": true,
  "data": {
    "cards": { "totalBooks": 10, "totalMembers": 6, "totalLoans": 12, "availableBooks": 33, "activeLoans": 5, "overdueLoans": 1 },
    "charts": {
      "booksByCategory": [{ "category": "Informatika", "total": 4, "stock": 20 }],
      "loansPerMonth": [{ "label": "Mar 2026", "total": 2 }],
      "loanStatus": [{ "label": "Dipinjam", "total": 5 }]
    },
    "topBorrowedBooks": [{ "title": "Algoritma dan Pemrograman", "total": 3 }]
  }
}
```

---

## Penerapan Keamanan

| Aspek | Penerapan |
|---|---|
| **Hashing password** | `bcryptjs` dengan salt 10 putaran pada hook `pre('save')` model `User`; password tidak pernah disimpan dalam bentuk asli. |
| **Password tidak bocor** | Field `password` memakai `select: false`, jadi tidak ikut terbawa pada query biasa maupun respons API. |
| **JWT** | Token ditandatangani HS256 berisi `sub` (id) dan `role`, berlaku 1 hari, dikirim lewat `Authorization: Bearer <token>`. |
| **Protected route (backend)** | Middleware `protect` memverifikasi tanda tangan dan masa berlaku token, lalu mengambil ulang user dari database — token milik user yang sudah dihapus otomatis ditolak. |
| **Protected route (frontend)** | Komponen `ProtectedRoute` memblokir halaman tanpa sesi; interceptor Axios membersihkan token dan mengalihkan ke `/login` saat backend membalas 401. |
| **Otorisasi peran** | Middleware `authorize('admin')` tersedia untuk membatasi aksi berdasarkan peran (403). |
| **Validasi input** | `express-validator` pada register, login, tambah/ubah buku, tambah/ubah anggota, dan transaksi peminjaman; ditambah validasi tingkat schema Mongoose sebagai lapis kedua. |
| **Pesan login netral** | Email tidak terdaftar dan password salah membalas pesan yang sama, agar tidak membocorkan email mana yang ada di sistem. |
| **Helmet** | Header keamanan HTTP standar (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, dan lainnya). |
| **CORS** | Hanya origin pada `CORS_ORIGIN` yang diizinkan, bukan `*`. |
| **dotenv** | Seluruh rahasia dibaca dari environment; `.env` tidak ikut di-commit dan server menolak start bila rahasia belum diisi. |
| **Error handling global** | Satu error handler menyusun semua respons error; stack trace hanya muncul pada mode development, sehingga detail internal tidak bocor ke pengguna. |
| **Batas ukuran body** | `express.json({ limit: '1mb' })` membatasi payload yang diterima. |

---

## Deployment

Aplikasi ini terdiri dari tiga bagian yang dapat di-deploy terpisah:

1. **Database** — buat cluster gratis di MongoDB Atlas, lalu salin connection string-nya.
2. **Backend** — deploy folder `backend/` ke Render/Railway.
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`,
     dan `CORS_ORIGIN` diisi alamat frontend hasil deploy.
3. **Frontend** — deploy folder `frontend/` ke Vercel/Netlify.
   - Build command: `npm run build`, output directory: `dist`
   - Environment: `VITE_API_URL` diisi alamat backend + `/api`.
   - Karena aplikasi memakai client-side routing, arahkan seluruh path ke `index.html`
     (Vercel/Netlify menyediakan opsi SPA rewrite).

Setelah backend ter-deploy, perbarui `CORS_ORIGIN` agar cocok dengan domain frontend,
lalu deploy ulang backend.
