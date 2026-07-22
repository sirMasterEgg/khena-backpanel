import { apiClient } from "@/api/client";
import type { MediaFile } from "@/api/media";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type CollectionStatus = "draft" | "published";

/**
 * Bentuk 1 objek Collection dari API (contract.md bagian 10).
 * `coverImage`/`bannerImage` DITERIMA sebagai objek File lengkap — di request
 * body keduanya dikirim sebagai uuid lewat `coverId` dan `heroId`.
 */
export type Collection = {
	id: string;
	name: string;
	slug: string;
	coverImage: MediaFile | null;
	bannerImage: MediaFile | null;
	status: CollectionStatus;
	createdAt: string;
	updatedAt: string;
};

/** Item GET /collections — sama dengan Collection + totalProducts. */
export type CollectionListItem = Collection & { totalProducts: number };

/** Item products[] pada GET /collections/:id. `id` = detail product (varian) id. */
export type CollectionProductItem = {
	id: string;
	name: string;
	sku: string;
	order: number;
};

/** Bentuk GET /collections/:id. `products` terurut by `order` dari server. */
export type CollectionDetail = Collection & {
	totalProducts: number;
	products: CollectionProductItem[];
};

/**
 * Body POST /collections (contract.md bagian 10).
 * PENTING: `productIds` berisi ID detail product (VARIAN), bukan produk induk.
 * Urutan array = urutan tampil di collection.
 */
export type CollectionInput = {
	name: string;
	coverId: string; // uuid media
	heroId: string; // uuid media
	slug: string; // harus unik
	status: CollectionStatus;
	productIds: string[]; // detail product (varian) ids, boleh []
};

/**
 * PATCH partial — field yang tidak dikirim tidak diubah. Kalau `productIds`
 * dikirim (termasuk `[]`), daftar produk lama diganti seluruhnya.
 */
export type CollectionPatchInput = Partial<CollectionInput>;

/** GET /collections/stats. */
export type CollectionStats = {
	totalCollections: number;
	published: number;
	draft: number;
	totalProductsInCollections: number;
};

export type CollectionListParams = {
	search?: string;
	status?: CollectionStatus;
	sort?: "name" | "slug" | "createdAt";
	orderDir?: "asc" | "desc";
	page?: number;
	limit?: number;
};

export async function getCollectionStats() {
	const res =
		await apiClient.get<ApiSuccess<CollectionStats>>("/collections/stats");
	return res.data.data;
}

export async function listCollections(params?: CollectionListParams) {
	const res = await apiClient.get<ApiListSuccess<CollectionListItem>>(
		"/collections",
		{ params },
	);
	return res.data;
}

export async function getCollection(id: string) {
	const res = await apiClient.get<ApiSuccess<CollectionDetail>>(
		`/collections/${id}`,
	);
	return res.data.data;
}

export async function createCollection(body: CollectionInput) {
	const res = await apiClient.post<ApiSuccess<Collection>>(
		"/collections",
		body,
	);
	return res.data.data;
}

export async function patchCollection(id: string, body: CollectionPatchInput) {
	const res = await apiClient.patch<ApiSuccess<Collection>>(
		`/collections/${id}`,
		body,
	);
	return res.data.data;
}

export async function deleteCollection(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/collections/${id}`);
	return res.data.data;
}
