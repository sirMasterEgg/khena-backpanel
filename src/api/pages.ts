import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";

export type PageStatus = "draft" | "published";

/** Bentuk 1 objek Page dari API (contract.md bagian 31a). */
export type PageRow = {
	id: string;
	page: string;
	section: string;
	/** JSON bebas — bentuknya tergantung section. Di-cast di layer mapper. */
	data: unknown;
	status: PageStatus;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	createdBy: string | null;
	updatedBy: string | null;
	deletedBy: string | null;
};

export type ListPagesParams = {
	/** ⚠️ NAMA HALAMAN (mis. "home"), BUKAN nomor pagination. */
	page?: string;
	section?: string;
	status?: PageStatus;
};

/**
 * List section. TIDAK berpaginasi — respons hanya `{ data: [...] }`, tanpa
 * `meta`. Section `draft` ikut dikembalikan.
 */
export async function listPages(params?: ListPagesParams) {
	const res = await apiClient.get<ApiSuccess<PageRow[]>>("/pages", { params });
	return res.data.data;
}

export async function getPage(id: string) {
	const res = await apiClient.get<ApiSuccess<PageRow>>(`/pages/${id}`);
	return res.data.data;
}

// ---------- Upload gambar lewat placeholder @file: ----------

export const PAGES_MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (bukan 10 MB!)
export const PAGES_ACCEPTED_IMAGE_TYPES =
	"image/jpeg,image/png,image/webp,image/gif"; // TIDAK termasuk avif

export type PageFilePart = { key: string; file: File };

/**
 * Pengumpul file untuk satu request. Dipakai mapper saat menyusun `data`:
 * setiap gambar baru ditukar jadi placeholder "@file:fN" dan file-nya dicatat.
 *
 * Dengan helper ini, 4 error pasangan file/placeholder (gotcha #6) mustahil
 * terjadi: key hanya lahir SAAT dirujuk, dan tidak pernah kembar.
 */
export function createFileCollector() {
	const files: PageFilePart[] = [];
	let counter = 0;
	return {
		/**
		 * `url` = URL lama yang sudah tersimpan; `file` = gambar baru yang dipilih
		 * user. Kalau ada `file`, dia yang menang dan URL lama diabaikan.
		 */
		ref(value: { url: string; file?: File | null }): string {
			if (!value.file) return value.url;
			const key = `f${counter++}`;
			files.push({ key, file: value.file });
			return `@file:${key}`;
		},
		files,
	};
}

export type SavePageInput = {
	page?: string;
	section?: string;
	status?: PageStatus;
	/** Objek JS biasa — di-stringify di sini, JANGAN di-stringify dari pemanggil. */
	data?: unknown;
	files?: PageFilePart[];
};

function buildPageFormData(input: SavePageInput): FormData {
	const form = new FormData();
	if (input.page !== undefined) form.append("page", input.page);
	if (input.section !== undefined) form.append("section", input.section);
	if (input.status !== undefined) form.append("status", input.status);
	// Gotcha #3: `data` WAJIB berupa string JSON.
	if (input.data !== undefined) form.append("data", JSON.stringify(input.data));
	// Gotcha #5: fileKeys[i] berpasangan per index dengan files[i].
	for (const part of input.files ?? []) {
		form.append("fileKeys", part.key);
		form.append("files", part.file);
	}
	return form;
}

/**
 * JANGAN set header Content-Type manual — biarkan browser mengisi boundary
 * multipart-nya (pola sama seperti `uploadDirect` di src/api/media.ts).
 */
export async function createPage(
	input: SavePageInput & {
		page: string;
		section: string;
		status: PageStatus;
		data: unknown;
	},
) {
	const res = await apiClient.post<ApiSuccess<PageRow>>(
		"/pages",
		buildPageFormData(input),
	);
	return res.data.data;
}

/** Semua field opsional. ⚠️ `data` MENGGANTI PENUH isi lama (gotcha #8). */
export async function updatePage(id: string, input: SavePageInput) {
	const res = await apiClient.patch<ApiSuccess<PageRow>>(
		`/pages/${id}`,
		buildPageFormData(input),
	);
	return res.data.data;
}
