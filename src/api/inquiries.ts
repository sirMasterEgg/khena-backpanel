import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/** Lampiran pengirim — baris `external_attachments`, bukan modul Media. */
export type InquiryAttachment = {
	id: string;
	objectKey: string;
	storageProvider: string;
	bucket: string;
	/** Dihitung server dari objectKey + base URL, tidak disimpan di DB. */
	url: string;
};

export type Inquiry = {
	id: string;
	name: string;
	email: string;
	phone: string;
	subject: string;
	message: string;
	/** null kalau pengirim tidak melampirkan file. */
	attachment: InquiryAttachment | null;
	/** Timestamp nullable, BUKAN boolean. null = belum dibaca. */
	readAt: string | null;
	/** Timestamp nullable, toggle: null → terisi → null. */
	starredAt: string | null;
	/** Timestamp nullable. Selalu di-overwrite tiap kali POST /reply dipanggil. */
	repliedAt: string | null;
	createdAt: string;
};

export type InquiryListParams = {
	read?: boolean;
	starred?: boolean;
	replied?: boolean;
	search?: string;
	page?: number;
	limit?: number;
};

export async function listInquiries(params?: InquiryListParams) {
	const res = await apiClient.get<ApiListSuccess<Inquiry>>("/inquiries", {
		params,
	});
	return res.data; // { data, meta } — terurut createdAt desc
}

/** Detail satu pesan — dipakai saat id datang dari URL, bukan dari klik list. */
export async function getInquiry(id: string) {
	const res = await apiClient.get<ApiSuccess<Inquiry>>(`/inquiries/${id}`);
	return res.data.data;
}

/** Idempoten — tidak ada cara membuat pesan jadi "belum dibaca" lagi. */
export async function markInquiryRead(id: string) {
	const res = await apiClient.post<ApiSuccess<Inquiry>>(
		`/inquiries/${id}/read`,
	);
	return res.data.data;
}

/** Toggle: starredAt null → terisi → null. */
export async function toggleInquiryStar(id: string) {
	const res = await apiClient.post<ApiSuccess<Inquiry>>(
		`/inquiries/${id}/star`,
	);
	return res.data.data;
}

/**
 * Hanya mencatat `repliedAt` (selalu overwrite) — TIDAK mengirim email
 * sungguhan dan tidak menyimpan isi balasan. Pengiriman sungguhan lewat
 * `mailto:` di sisi client, lihat ReplyComposer.
 */
export async function markInquiryReplied(id: string) {
	const res = await apiClient.post<ApiSuccess<Inquiry>>(
		`/inquiries/${id}/reply`,
	);
	return res.data.data;
}

/** Hard delete — permanen, baris DB + lampiran di storage ikut terhapus. */
export async function deleteInquiry(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/inquiries/${id}`);
	return res.data.data;
}
