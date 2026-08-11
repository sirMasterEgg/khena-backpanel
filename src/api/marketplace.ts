import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/* ---------- GET /marketplace/orders (nested, 1 objek per ORDER) ---------- */
/** Satu baris item. Bentuknya sama dipakai di GET /orders maupun POST /log. */
export type MarketplaceOrderItem = {
	/** sales_order_items.id — dipakai sebagai key React. BUKAN untuk DELETE. */
	id: string;
	variantSku: string;
	productName: string;
	quantity: number;
	/** Total item ini (= unitPrice * quantity), BUKAN harga satuan. */
	revenue: number;
};

/** Satu order beserta seluruh itemnya. */
export type MarketplaceOrder = {
	/** sales_orders.id — SATU-SATUNYA nilai yang sah untuk DELETE. */
	id: string;
	/** Nomor invoice yang dibaca manusia, mis. "SHP-2026-0001". BUKAN uuid. */
	orderId: string;
	/** Teks bebas dari server. Bandingkan selalu dengan .toLowerCase(). */
	marketplace: string;
	date: string; // "YYYY-MM-DD"
	buyerName: string;
	totalRevenue: number;
	items: MarketplaceOrderItem[];
};

export type MarketplaceOrderListParams = {
	/** Cocok PERSIS (case-insensitive), bukan substring. */
	marketplace?: string;
	/**
	 * Menghitung ORDER, bukan item — satu order dengan banyak item tidak
	 * pernah "terpotong" antar halaman.
	 */
	page?: number;
	limit?: number;
};

/* ---------- GET /marketplace/stats (ALL-TIME, bukan 30 hari) ---------- */
export type MarketplaceChannelStats = {
	/** Bisa null kalau marketplaceName di DB kosong. Tangani null-safe. */
	marketplace: string | null;
	revenue: number;
	orders: number;
	/** SKU unik DI CHANNEL INI. Menjumlahkan semua channel != uniqueSkus. */
	skus: number;
};

export type MarketplaceStats = {
	totalRevenue: number;
	totalOrders: number;
	/** SKU unik GLOBAL — dihitung sekali walau terjual di beberapa channel. */
	uniqueSkus: number;
	/** Sudah terurut revenue DESCENDING dari server. */
	channels: MarketplaceChannelStats[];
};

/* ---------- POST /marketplace/log ---------- */
export type MarketplaceLogItemInput = {
	variantSku: string;
	quantity: number; // integer > 0
	revenue: number; // integer >= 0, WAJIB habis dibagi quantity
};

export type MarketplaceLogInput = {
	marketplace: string; // 1-50 char setelah trim
	date: string; // "YYYY-MM-DD"
	orderId: string; // 1-50 char setelah trim
	buyerName: string; // 1-255 char setelah trim
	items: MarketplaceLogItemInput[]; // minimal 1
};

/**
 * Response POST /marketplace/log bentuknya PERSIS SAMA dengan satu objek
 * order di GET /marketplace/orders — pakai ulang MarketplaceOrder.
 */
export type MarketplaceLogResponse = MarketplaceOrder;

/* ---------- POST /marketplace/import (PARTIAL SUCCESS) ---------- */
export type MarketplaceImportRowResult = {
	/** Nomor baris data mulai 1, header tidak dihitung. */
	row: number;
	orderId: string;
	variantSku: string;
	status: "success" | "failed";
	error?: string;
};

export type MarketplaceImportResponse = {
	total: number;
	successCount: number;
	failedCount: number;
	results: MarketplaceImportRowResult[];
};

/* ================= fungsi ================= */

export async function listMarketplaceOrders(
	params?: MarketplaceOrderListParams,
) {
	const res = await apiClient.get<ApiListSuccess<MarketplaceOrder>>(
		"/marketplace/orders",
		{ params },
	);
	return res.data; // { data, meta } — meta menghitung ORDER, bukan item
}

export async function getMarketplaceStats() {
	const res =
		await apiClient.get<ApiSuccess<MarketplaceStats>>("/marketplace/stats");
	return res.data.data;
}

export async function logMarketplaceOrder(body: MarketplaceLogInput) {
	const res = await apiClient.post<ApiSuccess<MarketplaceLogResponse>>(
		"/marketplace/log",
		body,
	);
	return res.data.data;
}

/**
 * Menghapus SATU ORDER PENUH beserta semua itemnya (soft delete di server).
 * `id` WAJIB `sales_orders.id` (field `id` di objek order dari
 * GET /marketplace/orders) — BUKAN `items[].id` (sales_order_items.id)
 * ataupun `orderId` (nomor invoice).
 */
export async function deleteMarketplaceOrder(id: string) {
	const res = await apiClient.delete<ApiSuccess<string>>(
		`/marketplace/orders/${id}`,
	);
	return res.data.data;
}

export async function importMarketplaceOrdersCsv(file: File) {
	const form = new FormData();
	form.append("file", file);
	// JANGAN set Content-Type manual — biarkan browser mengisi boundary
	// multipart-nya (pola sama seperti importStockAdjustmentsCsv di stocks.ts).
	const res = await apiClient.post<ApiSuccess<MarketplaceImportResponse>>(
		"/marketplace/import",
		form,
	);
	return res.data.data;
}

/**
 * Response-nya CSV MENTAH, bukan { data } — wajib responseType "blob".
 * Butuh Bearer token, jadi tidak bisa dipakai sebagai <a href> langsung.
 * Pola sama persis dengan downloadStockCsvExample() di stocks.ts.
 */
export async function downloadMarketplaceTemplate(): Promise<{
	blob: Blob;
	filename: string;
}> {
	const res = await apiClient.get<Blob>("/marketplace/template", {
		responseType: "blob",
	});
	const disposition = res.headers["content-disposition"] as string | undefined;
	const match = disposition?.match(/filename="?([^";]+)"?/);
	return {
		blob: res.data,
		filename: match?.[1] ?? "marketplace-orders-template.csv",
	};
}
