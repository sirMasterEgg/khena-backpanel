import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

/** Relasi nested pada `jobs`, sama bentuknya dengan modul Job. */
type Relation = { id: string; name: string };

/** Lampiran CV — baris `external_attachments`, bukan modul Media. */
export type ApplicantCv = {
	id: string;
	objectKey: string;
	storageProvider: string;
	bucket: string;
	/** Dihitung server dari objectKey + base URL, tidak disimpan di DB. */
	url: string;
};

export type Applicant = {
	id: string;
	name: string;
	email: string;
	/** null kalau lamaran tidak menyasar posisi tertentu (open application). */
	jobs: {
		id: string;
		jobTitle: string;
		department: Relation;
		employmentType: Relation;
	} | null;
	/** = applicants.created_at, di-rename `date` di response. */
	date: string;
	/** null kalau pelamar tidak melampirkan CV. */
	cv: ApplicantCv | null;
};

export type ApplicantListParams = {
	/** UUID job (posisi) — `jobs.id`. Dipakai filter dropdown di UI. */
	job?: string;
	/** UUID department — BUKAN nama. Belum dipakai UI, disiapkan saja. */
	department?: string;
	/** UUID employment type. Belum dipakai UI, disiapkan saja. */
	employmentType?: string;
	page?: number;
	limit?: number;
};

export async function listApplicants(params?: ApplicantListParams) {
	const res = await apiClient.get<ApiListSuccess<Applicant>>("/applicants", {
		params,
	});
	return res.data; // { data, meta } — terurut date desc
}

/** Hard delete — permanen, baris DB + objek CV di storage ikut terhapus. */
export async function deleteApplicant(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/applicants/${id}`);
	return res.data.data;
}
