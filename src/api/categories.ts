import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type CategoryStatus = "published" | "draft";

/** Bentuk 1 objek Category dari API (contract.md bagian 9). */
export type Category = {
	id: string;
	category: string;
	order: number;
	roomTypeId: string;
	status: CategoryStatus;
	createdAt: string;
	updatedAt: string;
};

/**
 * GET /categories/:id bentuknya BEDA dgn item di list: `roomTypeId` diganti
 * objek `roomType` yang sudah ter-expand.
 */
export type CategoryDetail = Omit<Category, "roomTypeId"> & {
	roomType: { id: string; roomType: string };
};

/** Body create & update (PUT body = sama dgn POST). */
export type CategoryInput = {
	roomTypeId: string;
	category: string;
	order: number;
	status: CategoryStatus;
};

export type CategoryStats = {
	totalCategories: number;
	publishedCategories: number;
	draftCategories: number;
	roomGroups: number;
};

/** Kolom sort valid di API — beda dgn nama field di response. */
export type CategorySortField =
	| "name"
	| "displayOrder"
	| "roomType"
	| "createdAt";

export type CategoryListParams = {
	search?: string;
	status?: CategoryStatus;
	roomTypeId?: string;
	sort?: CategorySortField;
	/** Arah sort. Bukan `order` — `order` adalah nama kolom urutan tampil. */
	orderDir?: "asc" | "desc";
	page?: number;
	limit?: number;
};

export async function listCategories(params: CategoryListParams) {
	const res = await apiClient.get<ApiListSuccess<Category>>("/categories", {
		params,
	});
	return res.data;
}

export async function getCategoryStats() {
	const res =
		await apiClient.get<ApiSuccess<CategoryStats>>("/categories/stats");
	return res.data.data;
}

export async function getCategory(id: string) {
	const res = await apiClient.get<ApiSuccess<CategoryDetail>>(
		`/categories/${id}`,
	);
	return res.data.data;
}

export async function createCategory(body: CategoryInput) {
	const res = await apiClient.post<ApiSuccess<Category>>("/categories", body);
	return res.data.data;
}

export async function updateCategory(id: string, body: CategoryInput) {
	const res = await apiClient.put<ApiSuccess<Category>>(
		`/categories/${id}`,
		body,
	);
	return res.data.data;
}

export async function deleteCategory(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/categories/${id}`);
	return res.data.data;
}

/**
 * Berapa banyak category yang masih memakai room type ini.
 * Dipakai untuk memblokir penghapusan room type yang masih terpakai.
 *
 * TODO(konfirmasi): backend tidak mendokumentasikan error "masih dipakai" untuk
 * DELETE /room-types/:id, jadi cek ini cuma guard UI — masih ada celah balapan
 * kalau ada admin lain menambah category tepat setelah pengecekan.
 */
export async function countCategoriesByRoomType(roomTypeId: string) {
	// limit: 1 karena yang dibutuhkan cuma angka meta.total, bukan isi datanya.
	const res = await listCategories({ roomTypeId, limit: 1 });
	return res.meta.total;
}
