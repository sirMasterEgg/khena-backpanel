import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/**
 * Metode pembayaran yang diterima API (contract.md bagian 18).
 * PERHATIKAN: tidak ada nilai "card" — UI memetakannya ke "debit".
 */
export type PosPaymentMethod =
	| "cash"
	| "transfer"
	| "debit"
	| "credit"
	| "qris";

/** Satu baris katalog kasir. Satuannya VARIAN, bukan produk. */
export type PosVariant = {
	detailProductId: string;
	/** Sudah berbentuk "<nama produk> - <nama warna>", langsung tampilkan. */
	variantName: string;
	sku: string;
	price: number;
	/** SUM stok aktif; bisa 0. */
	stock: number;
	/** null kalau varian belum punya gambar. */
	imageUrl: string | null;
};

export type PosVariantListParams = {
	/** Cari di nama produk induk. */
	name?: string;
	/** Cari di SKU varian. */
	sku?: string;
	categoryId?: string;
	page?: number;
	limit?: number;
};

export type PosOrderItemInput = {
	detailProductId: string;
	quantity: number;
};

/** Body POST /point-of-sales. `customerId` di-OMIT untuk transaksi walk-in. */
export type PosOrderInput = {
	customerId?: string;
	paymentMethod: PosPaymentMethod;
	items: PosOrderItemInput[];
};

/** Baris item pada response — semua nilainya snapshot dari server. */
export type PosOrderItem = {
	detailProductId: string;
	sku: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
};

/** Response POST /point-of-sales — sumber data untuk struk. */
export type PosOrder = {
	id: string;
	invoiceNumber: string;
	orderDate: string;
	customerId: string | null;
	paymentMethod: PosPaymentMethod;
	cashierName: string | null;
	status: "completed";
	createdVia: "pos";
	totalAmount: number;
	total: number;
	items: PosOrderItem[];
};

export async function listPosVariants(params?: PosVariantListParams) {
	const res = await apiClient.get<ApiListSuccess<PosVariant>>(
		"/point-of-sales/product-variants",
		{ params },
	);
	return res.data;
}

export async function createPosOrder(body: PosOrderInput) {
	const res = await apiClient.post<ApiSuccess<PosOrder>>(
		"/point-of-sales",
		body,
	);
	return res.data.data;
}
