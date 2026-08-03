import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/** Response POST & PATCH — lengkap dengan `note` + kolom audit. */
export type Supplier = {
	id: string;
	name: string;
	contactPerson: string | null;
	phone: string | null;
	email: string | null;
	note: string | null; // TUNGGAL: `note`, bukan `notes`
	createdAt: string;
	updatedAt: string;
};

/** Item GET /suppliers — TANPA `note` dan TANPA kolom audit. */
export type SupplierListItem = {
	id: string;
	name: string;
	contactPerson: string | null;
	phone: string | null;
	email: string | null;
};

/** GET /suppliers/:id — sama dengan list, PLUS `note`. */
export type SupplierDetail = SupplierListItem & { note: string | null };

export type SupplierListParams = {
	/** Dicari di name, contactPerson, email, ATAU phone. */
	search?: string;
	page?: number;
	limit?: number;
};

/** Body POST — hanya `name` yang wajib. */
export type SupplierInput = {
	name: string;
	contactPerson?: string;
	phone?: string;
	email?: string;
	note?: string;
};

/** Body PATCH — semua opsional; field nullable boleh dikosongkan dengan `null`. */
export type SupplierPatchInput = {
	name?: string;
	contactPerson?: string | null;
	phone?: string | null;
	email?: string | null;
	note?: string | null;
};

export async function listSuppliers(params?: SupplierListParams) {
	const res = await apiClient.get<ApiListSuccess<SupplierListItem>>(
		"/suppliers",
		{ params },
	);
	return res.data;
}

export async function getSupplier(id: string) {
	const res = await apiClient.get<ApiSuccess<SupplierDetail>>(
		`/suppliers/${id}`,
	);
	return res.data.data;
}

export async function createSupplier(body: SupplierInput) {
	const res = await apiClient.post<ApiSuccess<Supplier>>("/suppliers", body);
	return res.data.data;
}

export async function patchSupplier(id: string, body: SupplierPatchInput) {
	const res = await apiClient.patch<ApiSuccess<Supplier>>(
		`/suppliers/${id}`,
		body,
	);
	return res.data.data;
}

export async function deleteSupplier(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/suppliers/${id}`);
	return res.data.data;
}
