import { apiClient } from "@/api/client";
import type { MediaFile } from "@/api/media";
import type { ApiListSuccess } from "@/api/types";

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

export type CollectionListParams = {
	search?: string;
	status?: CollectionStatus;
	sort?: "name" | "slug" | "createdAt";
	orderDir?: "asc" | "desc";
	page?: number;
	limit?: number;
};

/**
 * Dipakai sebagai sumber opsi dropdown Collection di form product.
 * CRUD collection lain di luar scope issue #52.
 */
export async function listCollections(params?: CollectionListParams) {
	const res = await apiClient.get<ApiListSuccess<Collection>>("/collections", {
		params,
	});
	return res.data;
}
