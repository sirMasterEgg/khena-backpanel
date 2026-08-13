import { apiClient } from "@/api/client";
import type { OrderSalesStatus } from "@/api/orderSales";
import type { ApiSuccess } from "@/api/types";

export type DashboardGroupBy = "day" | "week" | "month";

/** Semua `created_via` ikut dihitung (contract.md bagian 29). */
export type DashboardCreatedVia =
	| "pos"
	| "order_sales"
	| "online"
	| "marketplace";

export type DashboardSalesPoint = {
	/** "YYYY-MM-DD". Untuk groupBy "week" = tanggal Senin, "month" = tanggal 1. */
	period: string;
	revenue: number;
	orders: number;
};

export type DashboardRecentOrder = {
	id: string;
	invoiceNumber: string;
	orderDate: string;
	/** null untuk transaksi POS/marketplace tanpa customer terdaftar. */
	customerName: string | null;
	total: number;
	status: OrderSalesStatus;
	createdVia: DashboardCreatedVia;
};

export type DashboardTopProduct = {
	/** ID VARIAN (detail_products.id), BUKAN id produk induk. */
	detailProductId: string;
	sku: string;
	productName: string;
	colorName: string;
	quantitySold: number;
	revenue: number;
	imageUrl: string | null;
};

export type DashboardPendingCounts = {
	orderAwaitingFulfillment: number;
	outOfStockProducts: number;
	lowStockProducts: number;
	unreadMessages: number;
	draftProducts: number;
};

export type DashboardSummary = {
	period: { startDate: string; endDate: string; groupBy: DashboardGroupBy };
	/** Hanya order berstatus `completed` yang dihitung. */
	totalRevenue: number;
	totalOrders: number;
	totalNewCustomers: number;
	/** SEMUA pesan masuk di periode ini, bukan cuma yang belum dibaca. */
	totalContactMessages: number;
	salesOverview: DashboardSalesPoint[];
	recentOrders: DashboardRecentOrder[];
	topProducts: DashboardTopProduct[];
	/** TIDAK ikut filter tanggal — ini kondisi terkini. */
	pendingTasks: DashboardPendingCounts;
};

export type DashboardParams = {
	/** "YYYY-MM-DD" */
	startDate?: string;
	endDate?: string;
	groupBy?: DashboardGroupBy;
};

/**
 * PERHATIKAN: query param modul ini snake_case (contract.md bagian 29),
 * beda dengan modul lain. Konversinya sengaja dikurung di sini saja supaya
 * pemanggil tetap menulis camelCase seperti biasa.
 */
export async function getDashboard(params?: DashboardParams) {
	const res = await apiClient.get<ApiSuccess<DashboardSummary>>("/dashboard", {
		params: {
			start_date: params?.startDate,
			end_date: params?.endDate,
			group_by: params?.groupBy,
		},
	});
	return res.data.data;
}

/* ---------- GET /dashboard/pending ---------- */

/** `total` = hasil COUNT sebenarnya, BUKAN items.length. */
export type PendingBucket<T> = { total: number; items: T[] };

export type PendingOrderItem = {
	id: string;
	invoiceNumber: string;
	orderDate: string;
	customerName: string | null;
	total: number;
	status: OrderSalesStatus;
};

export type PendingStockItem = {
	detailProductId: string;
	sku: string;
	productName: string;
	quantity: number;
	minStockAlert: number | null;
	/** null kalau varian belum punya gambar, sama seperti topProducts[].imageUrl. */
	imageUrl: string | null;
};

export type PendingMessageItem = {
	id: string;
	name: string;
	email: string;
	subject: string;
	createdAt: string; // ISO
};

export type PendingDraftItem = {
	id: string;
	name: string;
	baseSku: string;
	updatedAt: string; // ISO
};

export type DashboardPending = {
	/** Kategori yang sama dengan pendingTasks.orderAwaitingFulfillment. */
	orderAwaitingAction: PendingBucket<PendingOrderItem>;
	outOfStockProducts: PendingBucket<PendingStockItem>;
	lowStockProducts: PendingBucket<PendingStockItem>;
	unreadMessages: PendingBucket<PendingMessageItem>;
	draftProducts: PendingBucket<PendingDraftItem>;
};

/** `limit` = jumlah item maksimum PER KATEGORI (1–50, default server 5). */
export async function getDashboardPending(limit = 8) {
	const res = await apiClient.get<ApiSuccess<DashboardPending>>(
		"/dashboard/pending",
		{ params: { limit } },
	);
	return res.data.data;
}
