import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/** Nilai yang BOLEH dikirim di body POST/PATCH (kolom DB hanya 2 nilai ini). */
export type DiscountStatusInput = "active" | "inactive";

/**
 * Nilai yang BISA MUNCUL di response. `scheduled` & `expired` tidak disimpan di
 * DB — server menghitungnya dari startDate/endDate setiap kali data dibaca
 * (contract.md bagian 17). Jangan pernah kirim 2 nilai ini di request body.
 */
export type DiscountStatus = DiscountStatusInput | "scheduled" | "expired";

/** PERHATIKAN: `fixed_amount`, BUKAN `fixed` seperti di data dummy lama. */
export type DiscountType = "percentage" | "fixed_amount" | "free_shipping";

/** Kelompok A — scope, `appliesToId` HARUS null. */
export type DiscountScopeType =
	| "all_products"
	| "vip_customer"
	| "newsletter_subscribers"
	| "orders_over_10_million";

/** Kelompok B — entitas polymorphic, `appliesToId` WAJIB uuid. */
export type DiscountEntityType =
	| "collection"
	| "product"
	| "category"
	| "customer";

export type DiscountAppliesToType = DiscountScopeType | DiscountEntityType;

/** Response POST / PATCH / GET :id — punya `targetName` + kolom audit. */
export type Discount = {
	id: string;
	code: string;
	discountType: DiscountType;
	discountValue: number;
	appliesToType: DiscountAppliesToType;
	appliesToId: string | null;
	/** Nama entitas target hasil lookup. `null` kalau scope, atau target sudah dihapus. */
	targetName: string | null;
	startDate: string; // ISO datetime
	endDate: string; // ISO datetime
	usageLimit: number | null;
	used: number;
	status: DiscountStatus;
	createdAt: string;
	updatedAt: string;
};

/**
 * Item GET /discounts — SENGAJA tanpa `targetName` (server menghindari N+1
 * lookup polymorphic) dan tanpa kolom audit.
 */
export type DiscountListItem = {
	id: string;
	code: string;
	discountType: DiscountType;
	discountValue: number;
	appliesToType: DiscountAppliesToType;
	appliesToId: string | null;
	startDate: string;
	endDate: string;
	used: number;
	usageLimit: number | null;
	status: DiscountStatus;
};

export type DiscountListParams = {
	/** Dicari di `code` saja. */
	search?: string;
	status?: DiscountStatus;
	page?: number;
	limit?: number;
};

export type DiscountStats = {
	/** Kode yang benar-benar bisa dipakai SEKARANG (aktif + dalam rentang tanggal + belum kena usageLimit). */
	totalActiveDiscounts: number;
	totalRedemptions: number;
	/** Nominal potongan 30 hari terakhir. */
	totalRevenueImpact: number;
	/** Diskon aktif yang berakhir dalam 7 hari ke depan. */
	totalExpiringSoon: number;
	/**
	 * Jumlah baris per nilai status, untuk badge di tab.
	 * BELUM ADA di contract.md — backend menyusul. Karena itu OPSIONAL:
	 * UI wajib tetap jalan kalau field ini `undefined`.
	 * TODO(backend): konfirmasi nama field final sebelum dipakai produksi.
	 */
	statusCounts?: {
		all: number;
		active: number;
		scheduled: number;
		expired: number;
		inactive: number;
	};
};

/** Body POST. */
export type DiscountInput = {
	code: string;
	discountType: DiscountType;
	discountValue: number;
	appliesToType: DiscountAppliesToType;
	/** Wajib untuk tipe entitas, HARUS di-omit untuk tipe scope. */
	appliesToId?: string;
	startDate: string; // ISO datetime
	endDate: string; // ISO datetime
	usageLimit?: number | null;
	status: DiscountStatusInput;
};

/** Body PATCH — semua opsional. */
export type DiscountPatchInput = Partial<Omit<DiscountInput, "appliesToId">> & {
	/** `null` untuk mengosongkan target saat pindah ke tipe scope. */
	appliesToId?: string | null;
};

export async function listDiscounts(params?: DiscountListParams) {
	const res = await apiClient.get<ApiListSuccess<DiscountListItem>>(
		"/discounts",
		{ params },
	);
	return res.data;
}

export async function getDiscountStats() {
	const res =
		await apiClient.get<ApiSuccess<DiscountStats>>("/discounts/stats");
	return res.data.data;
}

export async function getDiscount(id: string) {
	const res = await apiClient.get<ApiSuccess<Discount>>(`/discounts/${id}`);
	return res.data.data;
}

export async function createDiscount(body: DiscountInput) {
	const res = await apiClient.post<ApiSuccess<Discount>>("/discounts", body);
	return res.data.data;
}

export async function patchDiscount(id: string, body: DiscountPatchInput) {
	const res = await apiClient.patch<ApiSuccess<Discount>>(
		`/discounts/${id}`,
		body,
	);
	return res.data.data;
}

export async function deleteDiscount(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/discounts/${id}`);
	return res.data.data;
}

/** Label human-readable tiap `appliesToType`, untuk Select dan kolom tabel. */
export const APPLIES_TO_LABELS: Record<DiscountAppliesToType, string> = {
	all_products: "All products",
	vip_customer: "VIP customers",
	newsletter_subscribers: "Newsletter subscribers",
	orders_over_10_million: "Orders > Rp 10.000.000",
	collection: "Collection",
	product: "Product",
	category: "Category",
	customer: "Customer",
};

/** Tipe entitas butuh `appliesToId`; tipe scope tidak boleh punya. */
export const ENTITY_TYPES: DiscountEntityType[] = [
	"collection",
	"product",
	"category",
	"customer",
];

export function isEntityType(
	type: DiscountAppliesToType,
): type is DiscountEntityType {
	return (ENTITY_TYPES as DiscountAppliesToType[]).includes(type);
}
