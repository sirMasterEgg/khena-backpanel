import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/** Nilai segment dari server (contract.md bagian 11, "Tahap 2"). */
export type CustomerSegment = "vip" | "loyal" | "new" | "regular";

/** Bentuk objek Customer — response POST & PATCH. TANPA `segment`. */
export type Customer = {
	id: string;
	name: string;
	email: string;
	phone: string;
	totalOrder: number; // tunggal
	lifetimeValue: number;
	lastOrderAt: string | null;
	joinedAt: string;
	internalNotes: string | null;
	createdAt: string;
	updatedAt: string;
};

/** Item GET /customers. Ada `segment`, TIDAK ada `internalNotes` & kolom audit. */
export type CustomerListItem = {
	id: string;
	name: string;
	email: string;
	phone: string;
	totalOrder: number; // tunggal
	lifetimeValue: number;
	lastOrderAt: string | null;
	joinedAt: string;
	segment: CustomerSegment;
};

/**
 * Bentuk GET /customers/:id.
 * PERHATIKAN: `totalOrders` JAMAK di sini (beda dengan list), dan ada
 * `averageOrder` yang dihitung server. Tidak ada `lastOrderAt`.
 */
export type CustomerDetail = {
	id: string;
	name: string;
	email: string;
	phone: string;
	joinedAt: string;
	internalNotes: string | null;
	totalOrders: number; // jamak
	lifetimeValue: number;
	averageOrder: number;
	segment: CustomerSegment;
};

/** GET /customers/stats. */
export type CustomerStats = {
	totalCustomers: number;
	vipCustomers: number;
	/** Jendela BERGULIR 30 hari terakhir, bukan awal bulan kalender. */
	newThisMonth: number;
	avgLifetimeValue: number;
};

export type CustomerListParams = {
	search?: string;
	/** `all` / tidak dikirim = tanpa filter. */
	segment?: "vip" | "loyal" | "new" | "all";
	sort?: "ltv" | "totalOrder" | "lastOrderAt" | "joinedAt" | "name";
	orderDir?: "asc" | "desc";
	page?: number;
	limit?: number;
};

/** Body POST /customers. Kolom cache & joinedAt TIDAK boleh ikut. */
export type CustomerInput = {
	name: string;
	email: string;
	phone: string;
};

/** Body PATCH — semua opsional, plus `internalNotes`. */
export type CustomerPatchInput = Partial<CustomerInput> & {
	internalNotes?: string | null;
};

export async function listCustomers(params?: CustomerListParams) {
	const res = await apiClient.get<ApiListSuccess<CustomerListItem>>(
		"/customers",
		{ params },
	);
	return res.data;
}

export async function getCustomerStats() {
	const res =
		await apiClient.get<ApiSuccess<CustomerStats>>("/customers/stats");
	return res.data.data;
}

export async function getCustomer(id: string) {
	const res = await apiClient.get<ApiSuccess<CustomerDetail>>(
		`/customers/${id}`,
	);
	return res.data.data;
}

export async function createCustomer(body: CustomerInput) {
	const res = await apiClient.post<ApiSuccess<Customer>>("/customers", body);
	return res.data.data;
}

export async function patchCustomer(id: string, body: CustomerPatchInput) {
	const res = await apiClient.patch<ApiSuccess<Customer>>(
		`/customers/${id}`,
		body,
	);
	return res.data.data;
}

/**
 * GET /customers/bulk — response-nya CSV mentah, bukan { data }, makanya
 * wajib `responseType: "blob"`.
 */
export async function exportCustomersCsv(): Promise<{
	blob: Blob;
	filename: string;
}> {
	const res = await apiClient.get<Blob>("/customers/bulk", {
		responseType: "blob",
	});
	// attachment; filename="customers-<timestamp>.csv"
	const disposition = res.headers["content-disposition"] as string | undefined;
	const match = disposition?.match(/filename="?([^";]+)"?/);
	return { blob: res.data, filename: match?.[1] ?? "customers.csv" };
}
