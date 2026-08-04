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

/* ================= Menu Orders (/orders, /orders/:id) ================= */

/** Nilai yang BISA disimpan di kolom status (5 nilai). */
export type OrderSalesStatus =
	| "pending"
	| "processing"
	| "shipped"
	| "completed"
	| "cancelled";

/**
 * Nilai yang boleh dipakai untuk MEMFILTER. `awaiting_fulfillment` adalah nilai
 * turunan (= pending + processing) — hanya untuk filter, TIDAK BOLEH dikirim ke
 * PATCH /:id/status (ditolak 422).
 */
export type OrderSalesStatusFilter = OrderSalesStatus | "awaiting_fulfillment";

/**
 * Transisi status yang DIIZINKAN server. Mengirim transisi di luar tabel ini
 * ditolak 400, termasuk mengirim status yang sama dengan status saat ini.
 * `completed` & `cancelled` bersifat terminal (tidak ada transisi keluar).
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
	OrderSalesStatus,
	OrderSalesStatus[]
> = {
	pending: ["processing", "cancelled"],
	processing: ["shipped", "cancelled"],
	shipped: ["completed", "cancelled"],
	completed: [],
	cancelled: [],
};

/** Item GET /order-sales. */
export type OrderSalesListItem = {
	/** uuid — dipakai untuk navigasi ke /orders/:id. BUKAN nomor invoice. */
	id: string;
	invoiceNumber: string; // mis. "SO-202608-0001" — ini yang ditampilkan ke user
	date: string; // "YYYY-MM-DD"
	/** null bila customer sudah di-soft-delete. */
	customer: string | null;
	items: {
		/** JUMLAH JENIS barang (banyaknya baris item), BUKAN SUM(quantity). */
		total: number;
		productVariants: {
			name: string; // sudah "<produk> - <warna>"
			imageUrl: string | null;
			price: number; // snapshot unitPrice saat order dibuat
		}[];
	};
	total: number;
	status: OrderSalesStatus;
};

export type OrderSalesListParams = {
	/** Cari di invoiceNumber ATAU nama customer. */
	search?: string;
	/** Hanya 3 nilai ini. TIDAK ada parameter `order`/`orderDir`. */
	sort?: "newest" | "oldest" | "total";
	status?: OrderSalesStatusFilter;
	page?: number;
	limit?: number;
};

/** GET /order-sales/stats. */
export type OrderSalesStats = {
	/** SUM(total) untuk order berstatus `completed` saja. */
	totalRevenue: number;
	totalOrders: number;
	/** 0 (bukan NaN) bila belum ada order completed. */
	averageOrderValue: number;
	awaitingFulfillment: number;
	total: {
		allOrders: number;
		awaitingFulfillment: number;
		pending: number;
		processing: number;
		shipped: number;
		completed: number;
		cancelled: number;
	};
};

export type OrderSalesTimeSlot = "morning" | "afternoon" | "evening";

export type OrderSalesDetailItem = {
	/** sales_order_items.id — INI yang dikirim ke mark-as-packed. */
	id: string;
	/** id varian; BUKAN id baris item. Jangan tertukar dengan `id` di atas. */
	detailProductId: string;
	name: string;
	sku: string;
	imageUrl: string | null;
	quantity: number;
	price: number;
	/** null = belum pernah ditandai; perlakukan SAMA DENGAN false. */
	isPacked: boolean | null;
};

/**
 * Bentuk GET /order-sales/:id. Namanya `OrderSalesDetail` (bukan `OrderDetail`
 * — itu sudah dipakai sebagai nama komponen halaman).
 */
export type OrderSalesDetail = {
	id: string;
	invoiceNumber: string;
	date: string;
	customer: {
		id: string;
		name: string;
		email: string;
		phone: string;
		/** cache customers.lifetimeValue */
		totalSpend: number;
	};
	shipping: {
		address: string;
		city: string;
		zipCode: string;
		province: string;
		trackingNumber: string | null;
	};
	items: OrderSalesDetailItem[];
	subtotal: number;
	shippingCost: number;
	/** Selalu 0 — modul belum mendukung diskon. */
	discount: number;
	total: number;
	status: OrderSalesStatus;
	/**
	 * Catatan internal (kolom `sales_orders.note`). Namanya SAMA dengan field
	 * body PATCH — jadi baca & tulis pakai nama yang sama: `internalNote`.
	 * PERHATIKAN: response POST /order-sales (tipe OrderSalesOrder di atas)
	 * menamainya `note` — jangan dicampur.
	 */
	internalNote: string | null;
	/** null bila KETIGA kolom delivery kosong. */
	delivery: {
		deliveryDate: string | null;
		timeSlot: OrderSalesTimeSlot | null;
		deliveryNotes: string | null;
	} | null;
};

/**
 * Partial update jadwal delivery & catatan internal. Field yang TIDAK dikirim
 * tidak diubah. Endpoint ini TIDAK menyentuh status — untuk itu pakai
 * updateOrderSalesStatus(). Ditolak 400 bila order sudah completed/cancelled.
 */
export type OrderSalesUpdateInput = {
	/** Format "YYYY-MM-DD". */
	deliveryDate?: string;
	/**
	 * PERHATIKAN namanya: di body PATCH bernama `deliveryTimeSlot`, tapi di
	 * response GET /:id field yang sama bernama `delivery.timeSlot`.
	 */
	deliveryTimeSlot?: OrderSalesTimeSlot;
	deliveryNotes?: string;
	/** Disimpan ke kolom `note` — sama dengan `internalNote` saat create. */
	internalNote?: string;
};

export type OrderSalesInvoice = {
	invoiceNumber: string;
	date: string;
	status: OrderSalesStatus;
	paymentMethod: OrderSalesPaymentMethod;
	company: { name: string; address: string; phone: string; email: string };
	customer: {
		name: string;
		email: string;
		phone: string;
		address: string;
		city: string;
		province: string;
		zipCode: string;
	};
	items: {
		name: string;
		sku: string;
		quantity: number;
		unitPrice: number;
		subtotal: number;
	}[];
	subtotal: number;
	shippingCost: number;
	discount: number;
	total: number;
	note: string | null;
};

export type OrderSalesShippingLabel = {
	invoiceNumber: string;
	date: string;
	trackingNumber: string | null;
	sender: { name: string; address: string; phone: string; zipCode: string };
	recipient: {
		name: string;
		phone: string;
		address: string;
		city: string;
		province: string;
		zipCode: string;
	};
	/** SUM(quantity) — jumlah unit fisik. BEDA dengan items.total di list. */
	totalItems: number;
	totalWeightGram: number;
	deliveryDate: string | null;
	timeSlot: string | null;
	deliveryNotes: string | null;
};

export async function listOrderSales(params?: OrderSalesListParams) {
	const res = await apiClient.get<ApiListSuccess<OrderSalesListItem>>(
		"/order-sales",
		{ params },
	);
	return res.data; // { data, meta } — meta dipakai pagination
}

export async function getOrderSalesStats() {
	const res =
		await apiClient.get<ApiSuccess<OrderSalesStats>>("/order-sales/stats");
	return res.data.data;
}

export async function getOrderSalesDetail(id: string) {
	const res = await apiClient.get<ApiSuccess<OrderSalesDetail>>(
		`/order-sales/${id}`,
	);
	return res.data.data;
}

/**
 * Response-nya CSV MENTAH, bukan { data } — wajib responseType "blob". Filter
 * sama dengan list, TANPA page/limit. Pola sama persis dengan
 * exportCustomersCsv() di src/api/customers.ts.
 */
export async function exportOrderSalesCsv(
	params?: Omit<OrderSalesListParams, "page" | "limit">,
): Promise<{ blob: Blob; filename: string }> {
	const res = await apiClient.get<Blob>("/order-sales/bulk", {
		params,
		responseType: "blob",
	});
	const disposition = res.headers["content-disposition"] as string | undefined;
	const match = disposition?.match(/filename="?([^";]+)"?/);
	return { blob: res.data, filename: match?.[1] ?? "orders.csv" };
}

/** Maksimal 50 id per request (dijaga di sisi pemanggil juga). */
export async function getOrderSalesInvoices(ids: string[]) {
	const res = await apiClient.get<ApiSuccess<OrderSalesInvoice[]>>(
		"/order-sales/invoice",
		{ params: { ids: ids.join(",") } },
	);
	return res.data.data;
}

/** Maksimal 50 id per request (dijaga di sisi pemanggil juga). */
export async function getOrderSalesShippingLabels(ids: string[]) {
	const res = await apiClient.get<ApiSuccess<OrderSalesShippingLabel[]>>(
		"/order-sales/shipping-label",
		{ params: { ids: ids.join(",") } },
	);
	return res.data.data;
}

/**
 * Edit jadwal delivery & catatan internal. Mengembalikan detail order terbaru
 * (bentuk sama dengan GET /:id) — pakai untuk mengisi cache.
 */
export async function updateOrderSales(
	id: string,
	body: OrderSalesUpdateInput,
) {
	const res = await apiClient.patch<ApiSuccess<OrderSalesDetail>>(
		`/order-sales/${id}`,
		body,
	);
	return res.data.data;
}

export async function markOrderItemPacked(
	orderId: string,
	body: { itemId: string; isPacked?: boolean }, // isPacked default true di server
) {
	const res = await apiClient.patch<
		ApiSuccess<{ id: string; isPacked: boolean }>
	>(`/order-sales/${orderId}/mark-as-packed`, body);
	return res.data.data;
}

/**
 * Mengembalikan DETAIL ORDER TERBARU (bentuk sama dengan GET /:id) — pakai
 * hasilnya untuk mengisi cache, jangan request ulang.
 */
export async function updateOrderSalesStatus(
	id: string,
	body: { status: OrderSalesStatus; trackingNumber?: string },
) {
	const res = await apiClient.patch<ApiSuccess<OrderSalesDetail>>(
		`/order-sales/${id}/status`,
		body,
	);
	return res.data.data;
}
