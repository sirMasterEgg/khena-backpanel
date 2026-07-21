import { apiClient } from "@/api/client";
import type { MediaFile } from "@/api/media";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/**
 * Bentuk RINGKAS color yang menempel di GET /finishes (contract.md bagian 11):
 * hanya 5 field, tanpa kolom audit dan tanpa `finishesId` — finish induknya
 * diketahui dari objek Finish tempat color ini berada.
 */
export type FinishColor = {
	id: string;
	name: string;
	hexCode: string;
	/** Objek File LENGKAP (bukan uuid), atau null kalau media-nya sudah dihapus. */
	swatchPhoto: MediaFile | null;
	notes: string | null;
};

/** Bentuk 1 objek Finish dari API (contract.md bagian 11). */
export type Finish = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

/** Hanya GET /finishes yang membawa `colors`; endpoint finish lain TIDAK. */
export type FinishWithColors = Finish & { colors: FinishColor[] };

export async function listFinishes(params?: { page?: number; limit?: number }) {
	const res = await apiClient.get<ApiListSuccess<FinishWithColors>>(
		"/finishes",
		{ params },
	);
	return res.data;
}

/** Body pakai key `finish`, tapi response field-nya bernama `name`. */
export async function createFinish(body: { finish: string }) {
	const res = await apiClient.post<ApiSuccess<Finish>>("/finishes", body);
	return res.data.data;
}

/**
 * Finish TIDAK BOLEH dihapus selama masih ada color aktif yang memakainya —
 * backend membalas `400 finish is still used by <n> color(s)`. Hapus atau
 * pindahkan dulu color-nya. Color yang sudah di-soft-delete tidak menghalangi.
 */
export async function deleteFinish(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/finishes/${id}`);
	return res.data.data;
}
