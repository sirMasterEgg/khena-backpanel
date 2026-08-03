import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type PurchaseOrderStatus =
	| "draft"
	| "ordered"
	| "received"
	| "cancelled";

/** Transisi yang diizinkan server (contract.md bagian 16). */
export const PO_ALLOWED_TRANSITIONS: Record<
	PurchaseOrderStatus,
	PurchaseOrderStatus[]
> = {
	draft: ["ordered", "cancelled"],
	ordered: ["received", "cancelled"],
	received: [],
	cancelled: [],
};

/** Response POST & PATCH. */
export type PurchaseOrder = {
	id: string;
	invoiceNumber: string; // di-generate server, mis. "PO-202607-0001"
	supplierId: string;
	orderDate: string; // "YYYY-MM-DD"
	expectedDeliveryDate: string | null;
	totalAmount: number; // dihitung server
	status: PurchaseOrderStatus;
	note: string | null;
	createdAt: string;
	updatedAt: string;
};

/** Item GET /purchase-orders — pakai `supplierName`, BUKAN `supplierId`. */
export type PurchaseOrderListItem = {
	id: string;
	invoiceNumber: string;
	supplierName: string;
	orderDate: string;
	/** Jumlah MACAM barang (banyaknya baris item), BUKAN total qty. */
	totalItems: number;
	totalAmount: number;
	status: PurchaseOrderStatus;
};

/** Satu baris item pada GET /purchase-orders/:id. */
export type PurchaseOrderProduct = {
	detailProductId: string;
	sku: string;
	productName: string;
	quantity: number;
	unitCost: number;
	/** quantity * unitCost — dihitung server, tidak ada di DB. */
	subtotal: number;
};

/** GET /purchase-orders/:id — punya supplierId DAN supplierName, plus products[]. */
export type PurchaseOrderDetail = {
	id: string;
	invoiceNumber: string;
	supplierId: string;
	supplierName: string;
	orderDate: string;
	expectedDeliveryDate: string | null;
	status: PurchaseOrderStatus;
	totalAmount: number;
	note: string | null;
	products: PurchaseOrderProduct[];
};

export type PurchaseOrderStats = {
	onOrder: number; // jumlah PO berstatus "ordered"
	onOrderValue: number; // SUM(totalAmount) PO "ordered"
	totalSuppliers: number; // jumlah supplier aktif
};

export type PurchaseOrderListParams = {
	/** Dicari di invoiceNumber ATAU nama supplier. */
	search?: string;
	status?: PurchaseOrderStatus;
	page?: number;
	limit?: number;
};

/** Item yang DIKIRIM ke server — hanya 3 field ini, tanpa sku/productName. */
export type PurchaseOrderProductInput = {
	detailProductId: string;
	quantity: number; // integer, minimal 1
	unitCost: number; // integer rupiah, minimal 0
};

/** Body POST. `invoiceNumber`, `status`, `totalAmount` TIDAK boleh dikirim. */
export type PurchaseOrderInput = {
	supplierId: string;
	orderDate: string; // "YYYY-MM-DD"
	expectedDeliveryDate?: string; // "YYYY-MM-DD", tidak boleh < orderDate
	note?: string;
	products: PurchaseOrderProductInput[]; // minimal 1, tanpa detailProductId duplikat
};

/** Body POST /purchase-orders/draft — sama dengan POST biasa, tapi `products` opsional. */
export type PurchaseOrderDraftInput = Omit<PurchaseOrderInput, "products"> & {
	products?: PurchaseOrderProductInput[];
};

/**
 * Body PATCH — semua opsional, plus `status`.
 * Kalau `products` dikirim, SELURUH item lama diganti (bukan merge).
 */
export type PurchaseOrderPatchInput = {
	supplierId?: string;
	orderDate?: string;
	expectedDeliveryDate?: string | null;
	note?: string | null;
	status?: PurchaseOrderStatus;
	products?: PurchaseOrderProductInput[];
};

export async function listPurchaseOrders(params?: PurchaseOrderListParams) {
	const res = await apiClient.get<ApiListSuccess<PurchaseOrderListItem>>(
		"/purchase-orders",
		{ params },
	);
	return res.data;
}

export async function getPurchaseOrderStats() {
	const res = await apiClient.get<ApiSuccess<PurchaseOrderStats>>(
		"/purchase-orders/stats",
	);
	return res.data.data;
}

export async function getPurchaseOrder(id: string) {
	const res = await apiClient.get<ApiSuccess<PurchaseOrderDetail>>(
		`/purchase-orders/${id}`,
	);
	return res.data.data;
}

export async function createPurchaseOrder(body: PurchaseOrderInput) {
	const res = await apiClient.post<ApiSuccess<PurchaseOrder>>(
		"/purchase-orders",
		body,
	);
	return res.data.data;
}

/** Sama dengan createPurchaseOrder, tapi PO tersimpan dengan status "draft". */
export async function createPurchaseOrderDraft(body: PurchaseOrderDraftInput) {
	const res = await apiClient.post<ApiSuccess<PurchaseOrder>>(
		"/purchase-orders/draft",
		body,
	);
	return res.data.data;
}

export async function patchPurchaseOrder(
	id: string,
	body: PurchaseOrderPatchInput,
) {
	const res = await apiClient.patch<ApiSuccess<PurchaseOrder>>(
		`/purchase-orders/${id}`,
		body,
	);
	return res.data.data;
}

export async function deletePurchaseOrder(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(
		`/purchase-orders/${id}`,
	);
	return res.data.data;
}
