// Satu sumber data untuk Dashboard. Semua derivasi angka dari dummy ada di sini
// supaya nanti gampang di-swap ke REST API (lihat issue contract.md §3.1).

import dayjs from "dayjs";
import type { Product } from "@/data/dummy";
import { dummyContacts, dummyOrders, dummyProducts } from "@/data/dummy";
import { formatIDR } from "@/utils/format";

export type Period = "week" | "month" | "quarter" | "year";

/** Rentang tanggal `[start, end]` (format "YYYY-MM-DD") untuk kedua ujung. */
export type DateRange = [string | null, string | null];

const fmt = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

/**
 * Rentang tanggal kalender untuk sebuah periode, dihitung dari hari ini.
 * Dipakai sebagai preset/suggestion di filter tanggal Dashboard.
 * Quarter dihitung manual supaya tidak butuh plugin dayjs `quarterOfYear`.
 */
export function rangeForPeriod(period: Period): [string, string] {
	const now = dayjs();
	switch (period) {
		case "week":
			return [fmt(now.startOf("week")), fmt(now.endOf("week"))];
		case "month":
			return [fmt(now.startOf("month")), fmt(now.endOf("month"))];
		case "quarter": {
			const start = now.month(Math.floor(now.month() / 3) * 3).startOf("month");
			const end = start.add(2, "month").endOf("month");
			return [fmt(start), fmt(end)];
		}
		case "year":
			return [fmt(now.startOf("year")), fmt(now.endOf("year"))];
	}
}

/**
 * Petakan rentang tanggal (dari preset atau pilihan manual) ke Period terdekat
 * berdasarkan lama rentang. Data Dashboard masih dummy & di-bucket per periode,
 * jadi rentang custom ikut memakai pengali periode terdekat.
 */
/** Keterangan rentang tanggal untuk ditampilkan, mis. "Jul 13 – Jul 19, 2026". */
export function formatDateRange(range: DateRange): string {
	const [start, end] = range;
	if (!start || !end) return "";
	const s = dayjs(start);
	const e = dayjs(end);
	const startFmt = s.isSame(e, "year")
		? s.format("MMM D")
		: s.format("MMM D, YYYY");
	return `${startFmt} – ${e.format("MMM D, YYYY")}`;
}

export function periodFromRange(range: DateRange): Period {
	const [start, end] = range;
	if (!start || !end) return "week";
	const days = dayjs(end).diff(dayjs(start), "day");
	if (days <= 10) return "week";
	if (days <= 45) return "month";
	if (days <= 150) return "quarter";
	return "year";
}

/** Pengali kasar per periode supaya angka statistik ikut berubah saat filter diganti. */
const periodMultiplier: Record<Period, number> = {
	week: 1,
	month: 4,
	quarter: 13,
	year: 52,
};

export type SummaryStat = {
	value: number;
	delta: number;
};

export type DashboardSummary = {
	revenue: SummaryStat;
	orders: SummaryStat;
	newCustomers: SummaryStat;
	pageViews: SummaryStat;
	contactMessages: SummaryStat;
};

/** Angka kartu statistik. Delta masih statis (dummy). */
export function getSummary(period: Period): DashboardSummary {
	const mult = periodMultiplier[period];

	const totalRevenue = dummyOrders.reduce((sum, o) => sum + o.total, 0) * mult;
	const orderCount = dummyOrders.length * mult;
	const unreadMessages = dummyContacts.filter(
		(c) => c.status === "unread",
	).length;

	return {
		revenue: { value: totalRevenue, delta: 18.6 },
		orders: { value: orderCount, delta: 12.3 },
		newCustomers: { value: 23 * mult, delta: 5.2 },
		pageViews: { value: 4521 * mult, delta: 22.1 },
		contactMessages: { value: unreadMessages, delta: -3.5 },
	};
}

export type SalesPoint = {
	label: string;
	value: number;
};

/** Granularitas sumbu-X grafik Sales Overview. */
export type SalesGranularity = "day" | "week" | "month";

/** Format label & skala nilai dummy per granularitas. */
const granularityConfig: Record<
	SalesGranularity,
	{ labelFormat: string; base: number; span: number }
> = {
	day: { labelFormat: "MMM D", base: 4_000_000, span: 5_000_000 },
	week: { labelFormat: "MMM D", base: 30_000_000, span: 20_000_000 },
	month: { labelFormat: "MMM YYYY", base: 120_000_000, span: 60_000_000 },
};

/** Hash deterministik (FNV-1a) supaya nilai dummy stabil per tanggal. */
function hashKey(key: string): number {
	let h = 2166136261;
	for (let i = 0; i < key.length; i++) {
		h ^= key.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

const MAX_SALES_POINTS = 400;

/**
 * Titik-titik grafik Sales Overview dihitung dari rentang tanggal + granularitas.
 * Jumlah titik = banyaknya bucket (day/week/month) yang muat dalam rentang —
 * mis. rentang 1 bulan dengan granularitas "month" → 1 titik, "week" → ±4–5,
 * "day" → ±30. Nilai masih dummy tapi deterministik terhadap tanggal.
 */
export function getSalesOverview(
	range: DateRange,
	granularity: SalesGranularity,
): SalesPoint[] {
	const [startStr, endStr] = range;
	if (!startStr || !endStr) return [];

	const end = dayjs(endStr);
	let cursor = dayjs(startStr);
	if (cursor.isAfter(end, "day")) return [];

	const { labelFormat, base, span } = granularityConfig[granularity];
	const steps = span / 100_000;
	const points: SalesPoint[] = [];

	while (!cursor.isAfter(end, "day") && points.length < MAX_SALES_POINTS) {
		const key = cursor.format("YYYY-MM-DD");
		points.push({
			label: cursor.format(labelFormat),
			value: base + (hashKey(key) % steps) * 100_000,
		});
		cursor = cursor.add(1, granularity);
	}

	return points;
}

export type TopProduct = {
	product: Product;
	sales: number;
	revenue: number;
};

/**
 * Produk terlaris. "sales" masih derivasi dummy (deterministik dari id) karena
 * dummyProducts belum punya angka penjualan sungguhan.
 */
export function getTopProducts(limit = 5): TopProduct[] {
	return dummyProducts
		.filter((p) => p.status === "published")
		.map((p) => {
			const sales = ((p.id * 37) % 120) + 8;
			return { product: p, sales, revenue: p.price * sales };
		})
		.sort((a, b) => b.sales - a.sales)
		.slice(0, limit);
}

export type PendingTaskCounts = {
	awaitingFulfillment: number;
	outOfStock: number;
	lowStock: number;
	unreadMessages: number;
	draftProducts: number;
	total: number;
};

/** Hitungan tugas untuk kartu Pending Tasks, semuanya dari dummy. */
export function getPendingTasks(): PendingTaskCounts {
	const awaitingFulfillment = dummyOrders.filter(
		(o) => o.status === "pending" || o.status === "processing",
	).length;
	const outOfStock = dummyProducts.filter((p) => p.stock === 0).length;
	const lowStock = dummyProducts.filter(
		(p) => p.stock > 0 && p.stock <= (p.lowStockAlert ?? 0),
	).length;
	const unreadMessages = dummyContacts.filter(
		(c) => c.status === "unread",
	).length;
	const draftProducts = dummyProducts.filter(
		(p) => p.status === "draft",
	).length;

	return {
		awaitingFulfillment,
		outOfStock,
		lowStock,
		unreadMessages,
		draftProducts,
		total:
			awaitingFulfillment +
			outOfStock +
			lowStock +
			unreadMessages +
			draftProducts,
	};
}

/**
 * Ambang "stok rendah" untuk halaman Pending Tasks. Dipakai untuk filter DAN
 * teks label supaya keduanya selalu sinkron dengan "Running low (≤ 8 units)".
 */
export const LOW_STOCK_THRESHOLD = 8;

/** Maksimal baris item yang ditampilkan per kategori sebelum "+ N more". */
export const MAX_PENDING_ITEMS = 8;

/** Satu baris item yang sudah dinormalisasi supaya komponen gampang me-render. */
export type PendingTaskItem = {
	id: string; // key unik, mis. order.id atau `product-${id}`
	thumbnail?: string; // URL gambar; kalau tidak ada → komponen pakai ikon kategori
	primary: string; // teks utama (baris atas)
	secondary: string; // keterangan (baris bawah)
	status?: string; // untuk StatusBadge (mis. "pending", "outofstock", "unread")
	value?: string; // nilai di ujung kanan (mis. total order / harga produk)
	to: string; // route saat baris diklik
};

export type PendingTaskCategoryKey =
	| "orders"
	| "outOfStock"
	| "lowStock"
	| "unread"
	| "drafts";

export type PendingTaskCategory = {
	key: PendingTaskCategoryKey;
	count: number; // TOTAL item (bukan cuma yang tampil)
	items: PendingTaskItem[]; // sudah dipotong maksimal MAX_PENDING_ITEMS
};

/**
 * Daftar item per kategori untuk halaman Pending Tasks. Mengembalikan 5 kategori
 * berurutan (orders, outOfStock, lowStock, unread, drafts). Semua dari dummy.
 */
export function getPendingTaskCategories(): PendingTaskCategory[] {
	// 1. Orders awaiting action — pending / processing, terbaru dulu.
	const orderRows = [...dummyOrders]
		.filter((o) => o.status === "pending" || o.status === "processing")
		.sort((a, b) => b.date.localeCompare(a.date));

	const orders: PendingTaskCategory = {
		key: "orders",
		count: orderRows.length,
		items: orderRows.slice(0, MAX_PENDING_ITEMS).map((o) => ({
			id: o.id,
			thumbnail: o.items[0]?.thumbnail,
			primary: `#${o.id} · ${o.customerName}`,
			secondary: `${o.status} · ${o.date}`,
			status: o.status,
			value: formatIDR(o.total),
			to: `/orders/${o.id}`,
		})),
	};

	// 2. Out of stock products — stock === 0.
	const outOfStockRows = dummyProducts.filter((p) => p.stock === 0);

	const outOfStock: PendingTaskCategory = {
		key: "outOfStock",
		count: outOfStockRows.length,
		items: outOfStockRows.slice(0, MAX_PENDING_ITEMS).map((p) => ({
			id: `product-${p.id}`,
			thumbnail: p.image,
			primary: p.name,
			secondary: `${p.sku} · ${p.category}`,
			status: "outofstock",
			value: formatIDR(p.price),
			to: `/products/${p.id}/edit`,
		})),
	};

	// 3. Running low — stok di antara 1 dan LOW_STOCK_THRESHOLD.
	const lowStockRows = dummyProducts.filter(
		(p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
	);

	const lowStock: PendingTaskCategory = {
		key: "lowStock",
		count: lowStockRows.length,
		items: lowStockRows.slice(0, MAX_PENDING_ITEMS).map((p) => ({
			id: `product-${p.id}`,
			thumbnail: p.image,
			primary: p.name,
			secondary: `${p.sku} · ${p.stock} units left`,
			status: "lowstock",
			value: formatIDR(p.price),
			to: `/products/${p.id}/edit`,
		})),
	};

	// 4. Unread customer messages.
	const unreadRows = dummyContacts.filter((c) => c.status === "unread");

	const unread: PendingTaskCategory = {
		key: "unread",
		count: unreadRows.length,
		items: unreadRows.slice(0, MAX_PENDING_ITEMS).map((c) => ({
			id: `contact-${c.id}`,
			primary: c.subject,
			secondary: `From ${c.name} · ${c.date}`,
			status: "unread",
			to: "/messages",
		})),
	};

	// 5. Draft products.
	const draftRows = dummyProducts.filter((p) => p.status === "draft");

	const drafts: PendingTaskCategory = {
		key: "drafts",
		count: draftRows.length,
		items: draftRows.slice(0, MAX_PENDING_ITEMS).map((p) => ({
			id: `product-${p.id}`,
			thumbnail: p.image,
			primary: p.name,
			secondary: `${p.sku} · ${p.category}`,
			status: "draft",
			value: formatIDR(p.price),
			to: `/products/${p.id}/edit`,
		})),
	};

	return [orders, outOfStock, lowStock, unread, drafts];
}
