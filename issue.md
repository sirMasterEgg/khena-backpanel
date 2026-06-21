# Issue: Halaman Products (Daftar Produk)

## Tujuan

Membangun ulang / melengkapi halaman **Products** agar sesuai spesifikasi final di
bawah. Halaman ini menampilkan daftar produk lengkap dengan ringkasan statistik,
tab filter status, toolbar pencarian/filter/sort, tabel produk, dan pagination.

> **Status saat ini:** File `src/pages/products/ProductsList.tsx` sudah ada dan
> berisi versi awal (tabs + filter + tabel + pagination sederhana). Issue ini
> melengkapinya agar 100% sesuai spesifikasi. **Jangan buat file baru dari nol** —
> modifikasi yang sudah ada.

---

## Konteks Teknis (WAJIB dibaca dulu)

Stack & konvensi yang sudah dipakai di project ini — **ikuti, jangan ganti**:

| Hal | Yang dipakai |
|-----|--------------|
| UI library | **Mantine v9** (`@mantine/core`, `@mantine/hooks`) |
| Ikon | `@tabler/icons-react` |
| Routing | `react-router` v8 (`useNavigate`) |
| Linter/formatter | **Biome** (tab indent, double quotes). Jalankan `npm run check` sebelum selesai |
| Import alias | `@/` → `src/` (contoh: `import { PageHeader } from "@/components/PageHeader"`) |
| Bahasa komentar | Boleh Indonesia (lihat `usePageTitle.ts`) |

Komponen & data yang **sudah ada dan harus dipakai ulang** (jangan bikin duplikat):

- `src/components/PageHeader.tsx` → props: `title`, `subtitle?`, `actions?`. Sudah otomatis menata title + subtitle + tombol aksi sejajar.
- `src/components/StatTile.tsx` → props: `icon`, `label`, `value`, `delta?`. Untuk kartu statistik.
- `src/components/StatusBadge.tsx` → props: `status`. Sudah mendukung `published | draft | scheduled | archived | outofstock | lowstock`, dll.
- `src/hooks/usePageTitle.ts` → set judul tab browser dinamis: `usePageTitle("Products")` → tab jadi `"Products — Khena Backpanel"`.
- `src/data/dummy.ts` → sumber data `dummyProducts`.

---

## Spesifikasi Final Halaman

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Products                                  [Import] [Export] [Add New Product]│
│  Edit product details and manage all product settings                        │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ Total    │ │ Total    │ │ Out of   │ │ Draft    │   ← cards               │
│  │ Products │ │Inventory │ │ stocks   │ │ Products │                         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                         │
├───────────────────────────────────────────────────────────────────────────┤
│  [All Products] [Published] [Draft] [Scheduled] [Archived]   ← tabs          │
│  [🔍 Search...] [Category ▾] [Status ▾] [Sort ▾]            ← toolbar         │
├───────────────────────────────────────────────────────────────────────────┤
│  ☐ | Product+SKU | Collection | Category | Price | Margin | Stock |           │
│      Last updated | Status | Action(⋮)                       ← table          │
│  ...rows...                                                                    │
│                          [ ‹ 1 2 3 › ]                       ← pagination     │
└───────────────────────────────────────────────────────────────────────────┘
```

### Detail elemen

1. **Header**
   - Title: `Products`
   - Subtitle: `Edit product details and manage all product settings`
   - Tombol aksi (sejajar title, urut kiri→kanan): **Import**, **Export**, **Add New Product**
     - `Import` & `Export`: `variant="default"` (outline), beri ikon `IconUpload` / `IconDownload`.
     - `Add New Product`: tombol utama (`variant filled`), ikon `IconPlus`, `onClick` → `navigate("/products/new")`.

2. **Cards statistik** (4 kartu, pakai `StatTile` + `Grid`)
   - **Total Products** → jumlah semua produk.
   - **Total Inventory** → total stok seluruh produk (jumlah field `stock`).
   - **Out of stocks** → jumlah produk dengan `stock === 0`.
   - **Draft Products** → jumlah produk dengan `status === "draft"`.
   - Semua angka **dihitung dari data**, bukan hardcode. `delta` boleh dikosongkan.

3. **Tabs** (filter berdasarkan status, pakai `Tabs` Mantine)
   - `All Products`, `Published`, `Draft`, `Scheduled`, `Archived`.
   - Tiap tab tampilkan jumlah, contoh: `All Products (4)`, `Published (2)`.
   - Saat tab dipilih, tabel **terfilter** sesuai status (kecuali "All Products" = semua).

4. **Toolbar** (di bawah tabs)
   - Search bar: `TextInput` + ikon `IconSearch`, filter berdasarkan nama produk / SKU.
   - Filter Category: `Select` (opsi dari kategori unik yang ada di data).
   - Filter Status: `Select` (Published, Draft, Scheduled, Archived).
   - Sort by: `Select` (Newest, Oldest, Name A-Z, Price low→high, Price high→low).

5. **Tabel produk** — kolom **urut**:
   | Kolom | Isi |
   |-------|-----|
   | ☐ Checkbox | Mantine `Checkbox` untuk pilih baris (+ checkbox "select all" di header) |
   | Product Name + SKU | Avatar gambar + nama (bold) + `SKU: xxx` di bawah (abu-abu) |
   | Collection | Nama koleksi produk |
   | Category | Kategori |
   | Price | `$` + harga |
   | Margin | Persentase margin (lihat Tahap 1 soal data) |
   | Stock | `Badge` warna: 0 = merah, <5 = kuning, else hijau |
   | Last updated | Tanggal/relatif (mis. "2 days ago") |
   | Status | `StatusBadge` |
   | Action | `Menu` (ikon `IconDots`): **Edit**, **Duplicate**, **Delete** (Delete `color="red"`) |

6. **Pagination**
   - `Pagination` Mantine, 10 item per halaman, diterapkan pada data yang **sudah** difilter & disortir.

---

## Tahapan Implementasi (kerjakan berurutan)

### Tahap 0 — Persiapan
- Baca file berikut agar paham pola yang ada:
  `src/pages/products/ProductsList.tsx`, `src/pages/Dashboard.tsx`,
  `src/components/PageHeader.tsx`, `src/components/StatTile.tsx`,
  `src/components/StatusBadge.tsx`, `src/data/dummy.ts`.
- Pastikan app jalan: `npm run dev`, buka route `/products`.

### Tahap 1 — Lengkapi data dummy
File: `src/data/dummy.ts`. Tiap objek di `dummyProducts` saat ini hanya punya
`id, name, sku, category, price, stock, status, image`. **Tambahkan field**:
- `collection: string` — contoh `"Modern Living"`, `"Minimalist"`, `"Classic"` (samakan dengan `dummyCollections` yang sudah ada).
- `cost: number` — harga modal (dipakai menghitung margin). Pastikan `cost < price`.
- `updatedAt: string` — tanggal ISO, contoh `"2026-06-19"`.

> **Margin** dihitung di komponen, bukan disimpan: `margin% = ((price - cost) / price) * 100`, dibulatkan. Buat helper kecil, mis. `const margin = Math.round(((p.price - p.cost) / p.price) * 100)`.

Tambahkan juga **minimal 12–15 produk** total (variasi status: ada yang `archived`,
beberapa `stock: 0`) supaya pagination & filter benar-benar kelihatan bekerja.

### Tahap 2 — Header & tombol aksi
Di `ProductsList.tsx`, ubah `<PageHeader>`:
- Tambah `subtitle="Edit product details and manage all product settings"`.
- Ganti `actions` jadi `Group` berisi 3 tombol (Import, Export, Add New Product) sesuai detail di atas.
- Untuk sekarang tombol **Import/Export cukup tampil** (boleh `onClick` kosong / `console.log` / notifikasi "coming soon"). Tidak perlu logika upload nyata.

### Tahap 3 — Cards statistik
- Tambahkan `Grid` berisi 4 `StatTile` tepat di bawah `PageHeader`.
- Hitung nilai dari `dummyProducts` (lihat detail card di atas). **Jangan hardcode angka.**
- Pakai ikon Tabler yang relevan, mis. `IconBox`, `IconStack2`, `IconAlertTriangle`, `IconPencil`.
- Responsif: `Grid.Col span={{ base: 12, sm: 6, md: 3 }}`.

### Tahap 4 — State filter, search, sort, tab
Tambahkan state dengan `useState`:
- `activeTab` (default `"all"`), `search`, `categoryFilter`, `statusFilter`, `sort`, `page`.

Buat satu variabel turunan `filteredProducts` yang menerapkan, **berurutan**:
1. Filter tab status (kecuali `all`).
2. Filter `statusFilter` dari Select (jika dipilih).
3. Filter `categoryFilter` (jika dipilih).
4. Search: cocokkan `search` ke `name` **atau** `sku` (case-insensitive).
5. Sort sesuai pilihan `sort`.

> Reset `page` ke 1 setiap kali filter/search/sort/tab berubah (mis. di `onChange` masing-masing).

Hitung jumlah per tab dari data penuh (bukan dari `filteredProducts`) supaya angka di tab tetap konsisten.

### Tahap 5 — Tabel
- Sesuaikan kolom **persis** seperti spesifikasi (tambah **Collection** & **Margin**, ganti action "View" → "Duplicate").
- Header: tambah `Checkbox` "select all". Tiap baris: `Checkbox` per produk.
  - State seleksi: `selectedIds: number[]` (`useState`). Toggle saat checkbox diklik.
  - "Select all" mencentang semua baris **di halaman aktif**.
- Action `Menu` berisi: **Edit** (`navigate(`/products/${id}/edit`)`), **Duplicate** (boleh stub), **Delete** (`color="red"`, boleh stub/`console.log`).

### Tahap 6 — Pagination
- Slice `filteredProducts` per 10 item sesuai `page`:
  `const paged = filteredProducts.slice((page - 1) * 10, page * 10)`.
- `total={Math.ceil(filteredProducts.length / 10)}`.
- Tabel me-render `paged`, bukan seluruh data.

### Tahap 7 — Judul halaman dinamis
- Sudah ada `usePageTitle("Products")` di file. **Pastikan tetap ada** — ini yang membuat judul tab browser dinamis (`"Products — Khena Backpanel"`).
- Tidak perlu perubahan tambahan kecuali memastikan hook dipanggil di paling atas komponen.

### Tahap 8 — Rapikan & verifikasi
- Jalankan `npm run check` (Biome) dan perbaiki semua warning/error.
- Jalankan `npm run build` untuk memastikan TypeScript lolos (tidak ada `any` liar / tipe salah).
- Cek manual di browser route `/products`:
  - [ ] Subtitle & 3 tombol aksi tampil sejajar title.
  - [ ] 4 cards menampilkan angka hasil hitungan yang benar.
  - [ ] Klik tiap tab → tabel terfilter & angka tab benar.
  - [ ] Search, filter category, filter status, sort semua bekerja & bisa dikombinasikan.
  - [ ] Kolom tabel lengkap (Collection & Margin muncul, Margin = persen).
  - [ ] Checkbox baris & "select all" bekerja.
  - [ ] Action menu: Edit pindah ke editor; Duplicate & Delete tidak error.
  - [ ] Pagination berpindah halaman & ikut filter.
  - [ ] Judul tab browser = "Products — Khena Backpanel".

---

## Definition of Done
- [ ] Semua item checklist Tahap 8 terpenuhi.
- [ ] `npm run check` & `npm run build` lolos tanpa error.
- [ ] Tidak ada angka hardcode untuk cards/tab counts (semua dihitung dari data).
- [ ] Komponen reusable (`PageHeader`, `StatTile`, `StatusBadge`, `usePageTitle`) dipakai ulang, bukan dibuat ulang.

## Catatan / Batasan
- Semua data masih **dummy** (belum ada API). Fitur Import/Export/Duplicate/Delete cukup berupa stub UI; integrasi backend di luar scope issue ini.
- Jangan ubah routing — route `/products`, `/products/new`, `/products/:id/edit` sudah terdaftar di `src/router.tsx`.
