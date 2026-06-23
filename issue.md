# Feature: Halaman Collections

> **Target pelaksana:** Junior engineer / AI model murah.
> Ikuti tahapan di bawah **secara berurutan**. Sebagian besar pekerjaan adalah
> **meniru pola yang sudah ada** di `src/pages/products/ProductsList.tsx`.
> Jangan menemukan pola baru — copy pattern yang sudah ada di project ini.

## Title & Subtitle Halaman

- **title:** `Collections`
- **subtitle:** `Edit collections and manage all collections settings`

## Ringkasan Layout (dari atas ke bawah)

1. **Header**: title + subtitle di kiri, tombol **Add Collections** di kanan (sejajar dengan title).
2. **Stats cards** (4 kartu): Total Collections, Published, Draft, Product in Collections.
3. **Toolbar filter**: `Search` + `Filter by status` di **kiri**, `Sort by` di **kanan**.
4. **Tabel list collections**: No urut, Nama collection, Jumlah produk, Status, Action (Edit / Duplicate / Delete). Row bisa diklik → buka halaman detail.
5. **Pagination** di bawah tabel.

---

## Konteks Penting (BACA DULU)

Project ini sudah punya semua tools yang dibutuhkan. **Jangan install library baru.**

- **UI library:** Mantine (`@mantine/core`) — komponen seperti `Container`, `Grid`, `Card`,
  `Group`, `Stack`, `Table`, `Select`, `TextInput`, `Pagination`, `Menu`, `ActionIcon`, `Button`.
- **Icons:** `@tabler/icons-react`.
- **Routing:** `react-router` (pakai `useNavigate`).
- **Komponen reusable yang WAJIB dipakai:**
  - `@/components/PageHeader` → untuk title + subtitle + tombol action.
  - `@/components/StatTile` → untuk stats cards.
  - `@/components/StatusBadge` → untuk badge status (sudah support `"published"`, `"draft"`).
- **Hook:** `@/hooks/usePageTitle` → set judul tab browser.
- **Data dummy:** `@/data/dummy.ts` (sudah ada `dummyCollections`, perlu diperluas — lihat Tahap 1).

**Referensi utama:** Buka `src/pages/products/ProductsList.tsx`. Halaman Collections ini
adalah versi **lebih sederhana** dari halaman itu. Hampir semua logika (filter, sort, pagination,
row clickable, action menu) tinggal disalin dan disesuaikan.

---

## Tahapan Implementasi

### Tahap 1 — Siapkan data dummy

File: `src/data/dummy.ts`

`dummyCollections` saat ini terlalu sederhana:

```ts
export const dummyCollections = [
	{ id: 1, name: "Modern Living", count: 24 },
	{ id: 2, name: "Minimalist", count: 18 },
	{ id: 3, name: "Classic", count: 12 },
];
```

Ganti menjadi bertipe dan punya field yang dibutuhkan tabel + stats. Tambahkan `type`
`Collection` dan **minimal 12–15 item** supaya pagination kelihatan jalan.

```ts
export type Collection = {
	id: number;
	name: string;
	productCount: number; // jumlah produk di collection
	status: "published" | "draft";
	updatedAt: string; // format "YYYY-MM-DD", untuk sorting
};

export const dummyCollections: Collection[] = [
	{ id: 1, name: "Modern Living", productCount: 24, status: "published", updatedAt: "2026-06-19" },
	{ id: 2, name: "Minimalist", productCount: 18, status: "published", updatedAt: "2026-06-18" },
	{ id: 3, name: "Classic", productCount: 12, status: "draft", updatedAt: "2026-06-17" },
	// ... tambahkan total minimal 12-15 item dengan variasi status & tanggal
];
```

> **Catatan:** field `name` lama (`count`) diganti `productCount`. Cek apakah ada file lain yang
> masih memakai `dummyCollections.count` — kalau ada, sesuaikan. (Grep: `dummyCollections`.)

---

### Tahap 2 — Buat file halaman baru

Buat file: `src/pages/collections/CollectionsList.tsx`

Buat folder `collections` baru (sejajar dengan folder `products`).

Mulai dari kerangka berikut, lalu isi sesuai tahap-tahap di bawah:

```tsx
import { Container } from "@mantine/core";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CollectionsList() {
	usePageTitle("Collections");

	return (
		<Container size="xl">
			<PageHeader
				title="Collections"
				subtitle="Edit collections and manage all collections settings"
			/>
		</Container>
	);
}
```

---

### Tahap 3 — Daftarkan route

File: `src/router.tsx`

1. Tambahkan import di bagian atas (ikuti urutan alfabet/grup yang sudah ada):
   ```tsx
   import { CollectionsList } from "@/pages/collections/CollectionsList";
   ```
2. Cari route `/collections` yang sekarang masih pakai `PlaceholderPage`:
   ```tsx
   {
       path: "/collections",
       element: <PlaceholderPage title="Collections" />,
   },
   ```
   Ganti `element`-nya jadi `<CollectionsList />`.
3. Tambahkan juga route detail (dipakai di Tahap 7). Letakkan tepat di bawah route `/collections`:
   ```tsx
   {
       path: "/collections/:id",
       element: <CollectionDetail />,
   },
   ```
   (Import `CollectionDetail` juga — file ini dibuat di Tahap 7.)

> Verifikasi: jalankan app, buka menu **Collections** di sidebar — harus tampil title + subtitle.

---

### Tahap 4 — Tombol "Add Collections" (sejajar title)

`PageHeader` punya prop `actions` yang dirender di kanan, sejajar dengan title.
Tambahkan tombol via prop tersebut:

```tsx
import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
// ...
<PageHeader
	title="Collections"
	subtitle="Edit collections and manage all collections settings"
	actions={
		<Button leftSection={<IconPlus size={16} />}>
			Add Collections
		</Button>
	}
/>
```

> Untuk sekarang tombol belum perlu aksi (belum ada halaman create). Cukup tampil.
> Kalau mau, bisa `onClick={() => navigate("/collections/new")}` tapi **tidak wajib** di issue ini.

---

### Tahap 5 — Stats cards (4 kartu)

Pakai komponen `StatTile` di dalam `Grid` (lihat contoh persis di `ProductsList.tsx` baris ~193-222).

Empat kartu yang harus ada:

| Label                  | Nilai (hitung dari `dummyCollections`)                        |
| ---------------------- | ------------------------------------------------------------- |
| Total Collections      | `dummyCollections.length`                                     |
| Published              | jumlah item dengan `status === "published"`                   |
| Draft                  | jumlah item dengan `status === "draft"`                       |
| Product in Collections | total `productCount` semua item (pakai `reduce`)              |

Hitung memakai `useMemo` (tiru blok `stats` di `ProductsList.tsx` baris ~49-59):

```tsx
const stats = useMemo(() => ({
	total: dummyCollections.length,
	published: dummyCollections.filter((c) => c.status === "published").length,
	draft: dummyCollections.filter((c) => c.status === "draft").length,
	productInCollections: dummyCollections.reduce((sum, c) => sum + c.productCount, 0),
}), []);
```

Layout grid: 4 kolom di desktop, responsive — pakai `span={{ base: 12, sm: 6, md: 3 }}`
seperti contoh. Pilih icon yang masuk akal dari `@tabler/icons-react`
(contoh: `IconStack2`, `IconCircleCheck`, `IconPencil`, `IconBox`).

---

### Tahap 6 — Toolbar: Search + Filter by status (kiri), Sort by (kanan)

Bungkus dalam `Card withBorder mb="md"`. Layout: **dua sisi** — kiri & kanan.
Gunakan `Group justify="space-between"`:

```tsx
<Card withBorder mb="md">
	<Group justify="space-between">
		{/* KIRI: search + filter status */}
		<Group>
			<TextInput
				placeholder="Search collections..."
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => handleFilterChange(() => setSearch(e.currentTarget.value))}
			/>
			<Select
				placeholder="Status"
				data={["published", "draft"]}
				value={statusFilter}
				onChange={(val) => handleFilterChange(() => setStatusFilter(val))}
				clearable
			/>
		</Group>

		{/* KANAN: sort by */}
		<Select
			placeholder="Sort by"
			data={[
				{ value: "newest", label: "Newest" },
				{ value: "oldest", label: "Oldest" },
				{ value: "name-az", label: "Name A-Z" },
				{ value: "products-high", label: "Most products" },
			]}
			value={sortBy}
			onChange={setSortBy}
			clearable
		/>
	</Group>
</Card>
```

State yang diperlukan (tiru `ProductsList.tsx` baris ~41-45):

```tsx
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<string | null>(null);
const [page, setPage] = useState(1);
```

Logika filter + sort: buat `filteredCollections` dengan `useMemo` (tiru baris ~62-118 di
`ProductsList.tsx`, tapi lebih simpel):
- filter `search` → cocokkan ke `name` (lowercase `includes`).
- filter `statusFilter` → cocokkan ke `status`.
- sort sesuai `sortBy` (`newest`/`oldest` pakai `updatedAt`, `name-az` pakai `localeCompare`,
  `products-high` pakai `productCount`).

Juga salin helper `handleFilterChange` (baris ~129-132) supaya `page` reset ke 1 setiap
filter berubah.

---

### Tahap 7 — Tabel list collections

Bungkus dalam `Card withBorder`. Pakai `Table` dari Mantine. Kolom (urut kiri→kanan):

| Kolom         | Isi                                                              |
| ------------- | --------------------------------------------------------------- |
| No            | nomor urut (1, 2, 3, ...) — lihat catatan di bawah              |
| Collection    | `collection.name`                                               |
| Products      | `collection.productCount`                                       |
| Status        | `<StatusBadge status={collection.status} />`                    |
| Action        | Menu: Edit, Duplicate, Delete                                   |

**Nomor urut** harus ikut pagination. Rumus:
`(page - 1) * itemsPerPage + index + 1` (di mana `index` dari `.map((c, index) => ...)`).

**Row clickable → halaman detail.** Sama persis seperti `ProductsList.tsx` baris ~315-318:

```tsx
<Table.Tr
	key={collection.id}
	style={{ cursor: "pointer" }}
	onClick={() => navigate(`/collections/${collection.id}`)}
>
```

**Kolom Action** pakai `Menu` + `ActionIcon` (tiru baris ~366-393). **PENTING:** bungkus
`Table.Td` action dengan `onClick={(e) => e.stopPropagation()}` supaya klik tombol action
**tidak ikut** memicu navigasi row.

```tsx
<Table.Td onClick={(e) => e.stopPropagation()}>
	<Menu>
		<Menu.Target>
			<ActionIcon size="sm" variant="subtle">
				<IconDots size={14} />
			</ActionIcon>
		</Menu.Target>
		<Menu.Dropdown>
			<Menu.Item onClick={() => navigate(`/collections/${collection.id}/edit`)}>
				Edit
			</Menu.Item>
			<Menu.Item onClick={() => console.log(`Duplicate ${collection.id}`)}>
				Duplicate
			</Menu.Item>
			<Menu.Item color="red" onClick={() => console.log(`Delete ${collection.id}`)}>
				Delete
			</Menu.Item>
		</Menu.Dropdown>
	</Menu>
</Table.Td>
```

> Edit/Duplicate/Delete **belum perlu fungsi nyata** (belum ada backend). Cukup `console.log`
> atau `navigate` ke route yang belum ada — yang penting tombolnya tampil & bisa diklik.
> Jangan menghapus data dummy beneran.

**Empty state:** kalau hasil filter kosong, tampilkan satu baris "No collections found"
dengan `colSpan` sesuai jumlah kolom (tiru baris ~397-406).

**Buat juga file detail** `src/pages/collections/CollectionDetail.tsx` (placeholder dulu).
Contoh minimal:

```tsx
import { Container } from "@mantine/core";
import { useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { dummyCollections } from "@/data/dummy";

export function CollectionDetail() {
	const { id } = useParams();
	const collection = dummyCollections.find((c) => c.id === Number(id));
	usePageTitle(collection ? collection.name : "Collection");

	return (
		<Container size="xl">
			<PageHeader
				title={collection ? collection.name : "Collection not found"}
				subtitle="Collection details"
			/>
			{/* TODO: tampilkan detail collection + daftar produk di dalamnya */}
		</Container>
	);
}
```

---

### Tahap 8 — Pagination

Di bawah tabel (masih di dalam `Card` yang sama). Tiru `ProductsList.tsx` baris ~410-415.

```tsx
const itemsPerPage = 10;
const paged = filteredCollections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);
```

```tsx
{totalPages > 1 && (
	<Group justify="center" mt="md">
		<Pagination value={page} onChange={setPage} total={totalPages} />
	</Group>
)}
```

> `.map()` di tabel harus pakai `paged`, **bukan** `filteredCollections`.

---

## Checklist Verifikasi (lakukan setelah selesai)

- [ ] Menu **Collections** di sidebar membuka halaman baru (bukan PlaceholderPage).
- [ ] Title `Collections` + subtitle tampil. Tombol **Add Collections** sejajar di kanan title.
- [ ] 4 stats cards tampil dengan angka benar (cocokkan manual dengan data dummy).
- [ ] Search mempersempit tabel saat diketik.
- [ ] Filter status (`published`/`draft`) bekerja.
- [ ] Sort by mengubah urutan tabel.
- [ ] Search + filter status ada di **kiri**, sort by di **kanan**.
- [ ] Tabel menampilkan: No, Collection, Products, Status, Action.
- [ ] Klik row (di luar tombol action) → pindah ke `/collections/:id`.
- [ ] Klik tombol Action **tidak** memicu navigasi row.
- [ ] Pagination muncul saat data > 10 item dan berfungsi; nomor urut ikut halaman.
- [ ] Empty state muncul saat filter tidak ketemu.

## Cara Menjalankan & Cek

```bash
npm run dev      # jalankan dev server, buka URL yang muncul
npm run lint     # WAJIB: project pakai Biome, pastikan tidak ada error/warning
npm run build    # pastikan TypeScript tidak error
```

> **Aturan kualitas:** ikuti gaya kode yang sudah ada. Jangan pakai `any`
> (project pakai Biome `noExplicitAny`). Jangan tambah dependency baru.
> Semua data masih dummy — tidak ada panggilan API di issue ini.

## Ringkasan File yang Disentuh

| File                                          | Aksi                                          |
| --------------------------------------------- | --------------------------------------------- |
| `src/data/dummy.ts`                           | Perluas `dummyCollections` + type `Collection`|
| `src/pages/collections/CollectionsList.tsx`   | **Baru** — halaman utama                       |
| `src/pages/collections/CollectionDetail.tsx`  | **Baru** — halaman detail (placeholder)        |
| `src/router.tsx`                              | Daftarkan 2 route + ganti PlaceholderPage     |