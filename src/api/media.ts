import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";
import { env } from "@/config/env";

/** Bentuk 1 objek Folder dari API (contract.md bagian 7). */
export type MediaFolder = {
	id: string;
	name: string;
	parentId: string | null;
	path: string;
	createdAt: string;
	updatedAt: string;
};

export type MediaFileType = "image" | "video" | "audio" | "document";

/** `pending` = upload multipart yang belum di-`complete`, isinya belum utuh. */
export type MediaFileStatus = "pending" | "ready";

/** Bentuk 1 objek File dari API (contract.md bagian 7). */
export type MediaFile = {
	id: string;
	folderId: string | null;
	name: string;
	originalName: string;
	type: MediaFileType;
	mimeType: string;
	extension: string;
	sizeBytes: number;
	storageProvider: string;
	bucket: string;
	objectKey: string;
	/**
	 * URL public dari CDN. Ditandai nullable karena backend membentuknya dari
	 * env MEDIA_PUBLIC_BASE_URL yang belum tentu ter-set di semua environment.
	 * Jangan dibaca langsung — pakai getMediaPreviewUrl().
	 */
	url: string | null;
	width: number | null;
	height: number | null;
	duration: number | null;
	thumbnailKey: string | null;
	altText: string | null;
	metadata: unknown | null;
	status: MediaFileStatus;
	createdAt: string;
	updatedAt: string;
};

export type BrowseMediaResult = {
	path: string;
	folders: MediaFolder[];
	files: MediaFile[];
};

/** Kolom sort valid di API — beda dgn nama opsi sort di UI. */
export type MediaSortField = "name" | "createdAt" | "sizeBytes";

export type BrowseMediaParams = {
	search?: string;
	type?: MediaFileType;
	sort?: MediaSortField;
	order?: "asc" | "desc";
};

/**
 * Path folder dipakai sebagai segmen URL, jadi tiap segmen harus di-encode
 * sendiri — encodeURIComponent pada path utuh ikut mengubah pemisah "/".
 */
function toPathSegments(path: string) {
	return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

/**
 * Browse isi folder. `path` "/" atau "" = root.
 * PENTING: kalau `search` terisi, backend mencari di SEMUA folder dan
 * mengabaikan path aktif (lihat contract.md bagian 7).
 */
export async function browseMedia(path: string, params?: BrowseMediaParams) {
	const segments = toPathSegments(path);
	const res = await apiClient.get<ApiSuccess<BrowseMediaResult>>(
		segments ? `/media/${segments}` : "/media",
		{ params },
	);
	return res.data.data;
}

export async function getMediaFile(id: string) {
	const res = await apiClient.get<ApiSuccess<MediaFile>>(`/media/files/${id}`);
	return res.data.data;
}

export type FolderInput = {
	/** Folder induk. "" atau "/" = root. */
	path: string;
	folderName: string;
};

export async function createFolder(body: FolderInput) {
	const res = await apiClient.post<ApiSuccess<MediaFolder>>(
		"/media/folder",
		body,
	);
	return res.data.data;
}

/** Rename / pindah folder. `path` = folder induk baru (contract.md bagian 7). */
export async function updateFolder(id: string, body: FolderInput) {
	const res = await apiClient.put<ApiSuccess<MediaFolder>>(
		`/media/folder/${id}`,
		body,
	);
	return res.data.data;
}

/** Destruktif & cascade: seluruh subfolder + file di dalamnya ikut terhapus. */
export async function deleteFolder(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/media/folder/${id}`);
	return res.data.data;
}

export async function deleteMediaFile(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/media/files/${id}`);
	return res.data.data;
}

export type PatchMediaFileBody = {
	/** Kirim HANYA kalau file memang mau dipindah folder. */
	path?: string;
	file?: {
		name?: string;
		type?: string;
		size?: number;
		altText?: string;
	};
};

/**
 * Partial update — field yang tidak dikirim tidak berubah. Untuk sekadar
 * mengganti alt text cukup kirim `{ file: { altText } }`.
 */
export async function patchMediaFile(id: string, body: PatchMediaFileBody) {
	const res = await apiClient.patch<ApiSuccess<MediaFile>>(
		`/media/files/${id}`,
		body,
	);
	return res.data.data;
}

export type UploadDirectResult = {
	mediaId: string;
	fileName: string;
	objectKey: string;
	url: string | null;
	altText: string | null;
};

export async function uploadDirect(
	path: string,
	files: File[],
	altTexts?: string[],
) {
	const form = new FormData();
	form.append("path", path);
	for (const file of files) form.append("files", file);
	// altTexts dipasangkan PER INDEX dengan files — urutannya wajib sama.
	// Kalau altTexts lebih pendek dari files, sisanya tersimpan null.
	for (const alt of altTexts ?? []) form.append("altTexts", alt);

	// JANGAN set header Content-Type manual — biarkan browser yang mengisi
	// boundary multipart-nya. Interceptor di client.ts tetap menambahkan
	// Authorization + X-CSRF-Token secara otomatis.
	const res = await apiClient.post<ApiSuccess<UploadDirectResult[]>>(
		"/media/upload-direct",
		form,
	);
	return res.data.data;
}

/**
 * URL untuk tombol Download. Endpoint ini publik, jadi aman dipakai sebagai
 * href biasa. Juga jadi fallback preview saat `file.url` kosong.
 */
export function getMediaDownloadUrl(id: string) {
	return `${env.apiBaseUrl}/media/files/${id}/download`;
}

/**
 * URL untuk <img src> / "Copy URL". `url` kosong saat MEDIA_PUBLIC_BASE_URL
 * belum di-set di backend → jatuh ke endpoint download yang selalu tersedia.
 */
export function getMediaPreviewUrl(file: MediaFile) {
	return file.url?.trim() || getMediaDownloadUrl(file.id);
}
