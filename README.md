# ☕ Coffeeshop POS + Photobooth

Web app kasir coffeeshop dengan fitur photobooth thermal terintegrasi.

## Arsitektur

```
coffeeshop-pos/
├── apps/
│   ├── pos/          → POS Dashboard (kasir)  — port 5173
│   └── booth/        → Photobooth Station      — port 5174
├── packages/
│   └── shared/       → Types, utils, Supabase client (dipakai kedua app)
└── supabase/
    └── migrations/   → SQL schema lengkap
```

---

## 1. Setup Supabase

### Buat project baru
1. Buka [supabase.com](https://supabase.com) → New Project
2. Catat **Project URL** dan **anon public key** dari Settings → API

### Jalankan migration
1. Buka **SQL Editor** di Supabase Dashboard
2. Copy seluruh isi `supabase/migrations/001_initial_schema.sql`
3. Paste dan klik **Run**

Migration akan membuat:
- Tabel: `app_users`, `categories`, `products`, `discounts`, `orders`, `order_items`, `photo_sessions`
- Row Level Security (RLS) lengkap
- Storage bucket `photobooth`
- Data awal: 5 kategori, 13 produk, 3 diskon contoh

### Buat user pertama (owner)
Di Supabase Dashboard → Authentication → Users → Add user:
```
Email: owner@coffeshop.com
Password: (pilih password kuat)
User Metadata: {"full_name": "Nama Owner", "role": "owner"}
```

---

## 2. Setup Project Lokal

### Clone & install dependencies
```bash
git clone <repo-url>
cd coffeeshop-pos
npm install
```

### Konfigurasi environment

**POS app:**
```bash
cp apps/pos/.env.example apps/pos/.env
# Edit apps/pos/.env dengan nilai Supabase Anda
```

**Booth app:**
```bash
cp apps/booth/.env.example apps/booth/.env
# Edit apps/booth/.env dengan nilai Supabase Anda
```

Isi nilai di kedua `.env`:
```env
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BOOTH_BASE_URL=http://localhost:5174   # atau URL booth produksi
VITE_COFFEE_SHOP_NAME=Nama Coffeeshop Anda
```

### Jalankan development
```bash
# Jalankan kedua app sekaligus
npm run dev

# Atau terpisah
npm run pos     # http://localhost:5173
npm run booth   # http://localhost:5174
```

---

## 3. Cara Kerja Photobooth

```
Kasir (POS)                          Pelanggan                  Booth Station
    │                                     │                           │
    │─── Selesaikan transaksi ────────────┤                           │
    │─── Generate QR token ──────────────┤                           │
    │─── Cetak struk + QR ───────────────┤                           │
    │                                     │                           │
    │                          Scan QR di struk                       │
    │                                     │──── Buka /session/TOKEN ──┤
    │                                     │                     Validasi token
    │                                     │                     Tampilkan kamera
    │                                     │──── Foto / countdown ─────┤
    │                                     │                     Upload foto
    │                                     │                     Cetak struk final
    │                                     │                     (order + foto)
```

- Token QR expire otomatis dalam **30 menit**
- Setiap token hanya bisa dipakai **1 kali**
- Foto disimpan di Supabase Storage bucket `photobooth`

---

## 4. Skema Database

| Tabel | Keterangan |
|-------|-----------|
| `app_users` | User kasir, manager, owner |
| `categories` | Kategori menu (Kopi, Non-Kopi, dll) |
| `products` | Menu dengan harga & gambar |
| `discounts` | Kode promo (persentase / nominal) |
| `orders` | Transaksi lengkap |
| `order_items` | Item per transaksi (snapshot harga) |
| `photo_sessions` | Token QR + URL foto hasil booth |

---

## 5. Role & Akses

| Role | POS | Menu | Diskon | Laporan | Users |
|------|-----|------|--------|---------|-------|
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `cashier` | ✅ | ❌ | ❌ | ❌ (hanya miliknya) | ❌ |

---

## 6. Build Produksi

```bash
# Build POS
npm run build:pos
# Output: apps/pos/dist/

# Build Booth
npm run build:booth
# Output: apps/booth/dist/
```

Deploy dua app terpisah, misal:
- POS: `https://pos.yourcoffee.com`
- Booth: `https://booth.yourcoffee.com`

Update `VITE_BOOTH_BASE_URL` di env POS ke URL booth produksi.

---

## 7. Hardware Thermal Printer

Library yang direkomendasikan untuk print struk ESC/POS:
- **[escpos](https://www.npmjs.com/package/escpos)** — Node.js, via USB/Serial/Network
- **[PrintNode](https://printnode.com)** — cloud printing API
- **Web USB API** — langsung dari browser (Chrome only)

Untuk browser print sederhana, gunakan `window.print()` dengan CSS `@media print` yang sudah dikonfigurasi di `src/index.css`.

---

## Next Steps

Setelah fondasi ini, build selanjutnya:
1. **POS Dashboard** — halaman kasir, keranjang, checkout
2. **Booth Station** — tampilan idle, kamera, countdown, print
3. **Manajemen Menu** — CRUD produk + upload gambar
4. **Laporan** — grafik penjualan harian/mingguan
