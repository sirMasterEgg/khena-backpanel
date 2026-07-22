import { apiClient } from "@/api/client";
import type { MediaFile } from "@/api/media";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/**
 * Bentuk 1 objek Color dari API (contract.md bagian 12).
 * Nama field di RESPONSE berbeda dengan di REQUEST — bandingkan dgn ColorInput:
 * `name`/`color`, `hexCode`/`hex`, `finishesId`/`finishId`, `swatchPhoto`/`swatchImage`.
 */
export type Color = {
	id: string;
	name: string;
	/** 6 digit hex TANPA "#" (mis. "b23a2f"). Pakai withHash() sebelum dipakai di UI. */
	hexCode: string;
	/** DITERIMA sebagai objek File lengkap — bandingkan dgn ColorInput.swatchImage. */
	swatchPhoto: MediaFile | null;
	notes: string | null;
	finishesId: string;
	createdAt: string;
	updatedAt: string;
};

/** Body create & update — PUT body SAMA PERSIS dengan POST. */
export type ColorInput = {
	color: string;
	/** 6 digit hex TANPA "#" — lihat HEX_PATTERN. */
	hex: string;
	finishId: string;
	/**
	 * String "" = kosongkan notes. PENTING untuk PUT (full replace): mengirim
	 * `undefined` membuat field hilang dari body sehingga backend menahan notes
	 * lama — tidak bisa dikosongkan. Backend juga menolak `null` ("Expected
	 * property 'notes' to be string"), jadi selalu kirim string.
	 */
	notes?: string;
	/** DIKIRIM sebagai uuid media — bukan objek File. */
	swatchImage?: string;
};

/**
 * List datar berpaginasi. Halaman Color TIDAK memakainya — isi halaman itu
 * datang dari GET /finishes yang sudah membawa color-nya masing-masing.
 */
export async function listColors(params?: { page?: number; limit?: number }) {
	const res = await apiClient.get<ApiListSuccess<Color>>("/colors", { params });
	return res.data;
}

export async function getColor(id: string) {
	const res = await apiClient.get<ApiSuccess<Color>>(`/colors/${id}`);
	return res.data.data;
}

export async function createColor(body: ColorInput) {
	const res = await apiClient.post<ApiSuccess<Color>>("/colors", body);
	return res.data.data;
}

/**
 * PUT, bukan PATCH — body harus LENGKAP seperti POST. Field wajib yang tidak
 * ikut dikirim ditolak backend dengan 422. Pola yang sama ada di updateCategory.
 */
export async function updateColor(id: string, body: ColorInput) {
	const res = await apiClient.put<ApiSuccess<Color>>(`/colors/${id}`, body);
	return res.data.data;
}

export async function deleteColor(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/colors/${id}`);
	return res.data.data;
}

/**
 * Bentuk kanonik hex: tepat 6 digit, TANPA "#" — sama persis dengan
 * `Color.hexCode` dari API. Form menyimpan bentuk ini juga, jadi tidak ada
 * konversi bolak-balik; "#" murni urusan tampilan (lihat HexColorInput).
 */
export const HEX_PATTERN = /^[0-9a-fA-F]{6}$/;

/**
 * Bersihkan input mentah jadi bentuk kanonik: buang semua karakter non-hex,
 * potong 6, lowercase. Dipakai di setiap keystroke & paste — "#" ikut tersaring
 * karena bukan karakter hex, jadi paste "#FF0000" langsung jadi "ff0000".
 */
export function sanitizeHexInput(raw: string): string {
	return raw
		.replace(/[^0-9a-fA-F]/g, "")
		.slice(0, 6)
		.toLowerCase();
}

/** "b23a2f" → "#b23a2f" (untuk CSS backgroundColor & tampilan). */
export function withHash(hexCode: string): string {
	return `#${hexCode.replace(/^#/, "")}`;
}
