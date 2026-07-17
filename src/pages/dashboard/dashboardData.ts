// Satu sumber data untuk Dashboard. Semua derivasi angka dari dummy ada di sini
// supaya nanti gampang di-swap ke REST API (lihat issue contract.md §3.1).

import type { Product } from "@/data/dummy";
import { dummyContacts, dummyOrders, dummyProducts } from "@/data/dummy";

export type Period = "week" | "month" | "quarter" | "year";

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

const salesByPeriod: Record<Period, SalesPoint[]> = {
	week: [
		{ label: "Mon", value: 4_500_000 },
		{ label: "Tue", value: 6_200_000 },
		{ label: "Wed", value: 5_800_000 },
		{ label: "Thu", value: 7_500_000 },
		{ label: "Fri", value: 8_900_000 },
		{ label: "Sat", value: 7_200_000 },
		{ label: "Sun", value: 5_500_000 },
	],
	month: [
		{ label: "Week 1", value: 32_000_000 },
		{ label: "Week 2", value: 41_500_000 },
		{ label: "Week 3", value: 38_200_000 },
		{ label: "Week 4", value: 45_800_000 },
	],
	quarter: [
		{ label: "Month 1", value: 128_000_000 },
		{ label: "Month 2", value: 142_500_000 },
		{ label: "Month 3", value: 156_800_000 },
	],
	year: [
		{ label: "Q1", value: 420_000_000 },
		{ label: "Q2", value: 468_000_000 },
		{ label: "Q3", value: 512_000_000 },
		{ label: "Q4", value: 545_000_000 },
	],
};

/** Titik-titik grafik Sales Overview sesuai periode grafik. */
export function getSalesOverview(chartPeriod: Period): SalesPoint[] {
	return salesByPeriod[chartPeriod];
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
