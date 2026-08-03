import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/** Metode pembayaran yang diterima API (contract.md bagian 19). */
export type OrderSalesPaymentMethod =
	| "cash"
	| "transfer"
	| "debit"
	| "credit"
	| "qris";

/**
 * Satu baris katalog varian. Bentuknya IDENTIK dengan PosVariant, tapi sengaja
 * dideklarasikan ulang: kontrak menyebut endpoint ini duplikat penuh dengan
 * repository & service sendiri, jadi keduanya bebas berubah terpisah.
 */
export type OrderSalesVariant = {
	detailProductId: string;
	/** Sudah berbentuk "<nama produk> - <nama warna>", langsung tampilkan. */
	variantName: string;
	sku: string;
	price: number;
	/** SUM stok aktif; bisa 0. */
	stock: number;
	imageUrl: string | null;
};

export type OrderSalesVariantListParams = {
	/** Cari di nama produk induk saja — TIDAK mencari di SKU. */
	name?: string;
	sku?: string;
	categoryId?: string;
	page?: number;
	limit?: number;
};

export type OrderSalesItemInput = {
	detailProductId: string;
	quantity: number;
};

/** Body POST /order-sales. `customerId` WAJIB (beda dengan POS). */
export type OrderSalesInput = {
	customerId: string;
	/** Format YYYY-MM-DD. */
	orderDate: string;
	paymentMethod: OrderSalesPaymentMethod;
	shippingAddress: string;
	shippingCity: string;
	shippingProvince: string;
	shippingZipCode: string;
	/** Disimpan server ke kolom `note`. Omit kalau kosong. */
	internalNote?: string;
	items: OrderSalesItemInput[];
};

export type OrderSalesOrderItem = {
	detailProductId: string;
	sku: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
};

/** Response POST /order-sales — sumber data modal ringkasan. */
export type OrderSalesOrder = {
	id: string;
	invoiceNumber: string;
	orderDate: string;
	customerId: string;
	paymentMethod: OrderSalesPaymentMethod;
	status: "pending";
	createdVia: "order_sales";
	shippingAddress: string;
	shippingCity: string;
	shippingProvince: string;
	shippingZipCode: string;
	/** Dihitung server lewat Biteship; nilai dari client diabaikan. */
	shippingAmount: number;
	note: string | null;
	/** Subtotal barang saja. */
	totalAmount: number;
	/** totalAmount + shippingAmount. */
	total: number;
	items: OrderSalesOrderItem[];
};

export type ShippingCostParams = {
	shippingAddress: string;
	shippingCity: string;
	shippingProvince: string;
	shippingZipCode: string;
	items: OrderSalesItemInput[];
};

export async function listOrderSalesVariants(
	params?: OrderSalesVariantListParams,
) {
	const res = await apiClient.get<ApiListSuccess<OrderSalesVariant>>(
		"/order-sales/product-variants",
		{ params },
	);
	return res.data;
}

/**
 * PERHATIKAN: `items` dikirim sebagai JSON STRING di query, bukan repeated
 * param — lihat contract.md bagian 19.
 */
export async function getOrderSalesShippingCost(params: ShippingCostParams) {
	const res = await apiClient.get<ApiSuccess<{ shippingCost: number }>>(
		"/order-sales/shipping-cost",
		{
			params: {
				shippingAddress: params.shippingAddress,
				shippingCity: params.shippingCity,
				shippingProvince: params.shippingProvince,
				shippingZipCode: params.shippingZipCode,
				items: JSON.stringify(params.items),
			},
		},
	);
	return res.data.data.shippingCost;
}

export async function createOrderSalesOrder(body: OrderSalesInput) {
	const res = await apiClient.post<ApiSuccess<OrderSalesOrder>>(
		"/order-sales",
		body,
	);
	return res.data.data;
}
