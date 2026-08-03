import { apiClient } from "@/api/client";
import type { MediaFile } from "@/api/media";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/* ---------- Stats: GET /stocks/stats ---------- */
export type StockStats = {
	totalInventory: number;
	totalOutOfStock: number;
	totalRunningLow: number;
	/** Baris ledger baru hari ini dari SEMUA sumber (adjustment, PO, POS, order sales). */
	totalUpdatesToday: number;
};

/* ---------- Activity: GET /stocks/adjustments/activity ---------- */
export type StockActivitySource = "ADJUSTMENT" | "SYSTEM";

export type StockActivityItem = {
	id: string;
	source: StockActivitySource;
	sku: string;
	productName: string;
	/** Signed: positif = stok masuk, negatif = stok keluar. */
	quantity: number;
	reason: string | null;
	/** Nama/email admin pembuat; null untuk baris sistem lama. */
	by: string | null;
	timestamp: string; // ISO
};

export type StockActivityParams = {
	page?: number;
	limit?: number;
	source?: StockActivitySource;
};

/* ---------- Reorder list: GET /stocks/reorder-list ---------- */
export type StockReorderStatus = "OUT_OF_STOCK" | "RUNNING_LOW";

export type StockReorderItem = {
	/** ID VARIAN (detail_products.id), BUKAN id produk. */
	id: string;
	name: string; // nama produk induk
	sku: string;
	image: MediaFile | null; // gambar pertama varian
	inStock: number;
	/** products.minStockAlert; null bila belum diset. */
	reorderAt: number | null;
	status: StockReorderStatus;
};

export type StockReorderParams = {
	page?: number;
	limit?: number;
	status?: StockReorderStatus;
};

/* ---------- Adjustment: POST /stocks/adjustments ---------- */
/** PERHATIKAN: nilainya "increase"/"decrease", BUKAN "in"/"out". */
export type StockAdjustmentType = "increase" | "decrease";

export type StockAdjustmentInput = {
	sku: string;
	adjustmentType: StockAdjustmentType;
	/** Selalu POSITIF (integer >= 1). Arah ditentukan adjustmentType. */
	quantity: number;
	reason?: string;
};

export type StockAdjustment = {
	id: string;
	sku: string;
	adjustmentType: StockAdjustmentType;
	quantity: number;
	stockBefore: number;
	stockAfter: number;
	reason: string | null;
};

/* ---------- Bulk: POST /stocks/bulk-adjustments ---------- */
export type BulkAdjustmentRowResult = {
	/** Nomor baris data, mulai 1 (header tidak dihitung). */
	row: number;
	sku: string;
	status: "success" | "failed";
	error?: string;
};

/** Partial success: HTTP 200 bukan berarti semua baris berhasil. */
export type BulkAdjustmentsResponse = {
	total: number;
	successCount: number;
	failedCount: number;
	results: BulkAdjustmentRowResult[];
};

/* ---------- Lookup SKU: GET /stocks/:sku/status ---------- */
export type StockSkuStatus = {
	/** ID varian (detail_products.id). */
	id: string;
	sku: string;
	/** Sudah berbentuk "<nama produk> - <nama warna>", langsung tampilkan. */
	name: string;
	inStock: number;
};

/* ================= fungsi ================= */

export async function getStockStats() {
	const res = await apiClient.get<ApiSuccess<StockStats>>("/stocks/stats");
	return res.data.data;
}

export async function listStockActivity(params?: StockActivityParams) {
	const res = await apiClient.get<ApiListSuccess<StockActivityItem>>(
		"/stocks/adjustments/activity",
		{ params },
	);
	return res.data; // { data, meta } — meta dipakai untuk paginasi
}

export async function listStockReorder(params?: StockReorderParams) {
	const res = await apiClient.get<ApiListSuccess<StockReorderItem>>(
		"/stocks/reorder-list",
		{ params },
	);
	return res.data;
}

/**
 * Lookup EXACT satu varian lewat SKU. SKU ikut di path, jadi WAJIB
 * di-encodeURIComponent (SKU bisa mengandung spasi / karakter aneh).
 * SKU tidak ditemukan = error 400 "product variant not found", bukan null.
 */
export async function getStockSkuStatus(sku: string) {
	const res = await apiClient.get<ApiSuccess<StockSkuStatus>>(
		`/stocks/${encodeURIComponent(sku)}/status`,
	);
	return res.data.data;
}

export async function createStockAdjustment(body: StockAdjustmentInput) {
	const res = await apiClient.post<ApiSuccess<StockAdjustment>>(
		"/stocks/adjustments",
		body,
	);
	return res.data.data;
}

export async function importStockAdjustmentsCsv(file: File) {
	const form = new FormData();
	form.append("file", file);
	// JANGAN set Content-Type manual — biarkan browser mengisi boundary
	// multipart-nya (pola sama seperti importProductsCsv di products.ts).
	const res = await apiClient.post<ApiSuccess<BulkAdjustmentsResponse>>(
		"/stocks/bulk-adjustments",
		form,
	);
	return res.data.data;
}

/**
 * Response-nya CSV MENTAH, bukan { data } — wajib responseType "blob".
 * Butuh Bearer token, jadi tidak bisa dipakai sebagai <a href> langsung.
 * Pola sama persis dengan exportProductsCsv() di products.ts:193.
 */
export async function downloadStockCsvExample(): Promise<{
	blob: Blob;
	filename: string;
}> {
	const res = await apiClient.get<Blob>("/stocks/bulk-adjustments/example", {
		responseType: "blob",
	});
	const disposition = res.headers["content-disposition"] as string | undefined;
	const match = disposition?.match(/filename="?([^";]+)"?/);
	return {
		blob: res.data,
		filename: match?.[1] ?? "stock-adjustments-example.csv",
	};
}
