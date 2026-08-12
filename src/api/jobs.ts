import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type JobStatus = "open" | "closed" | "draft";

/** Relasi dikirim server sebagai objek nested, bukan uuid mentah. */
type JobRelation = { id: string; name: string };

/** Bentuk Job dari API — sama untuk list, detail, POST, dan PATCH. */
export type Job = {
	id: string;
	jobTitle: string;
	department: JobRelation;
	location: string;
	employmentType: JobRelation;
	status: JobStatus;
	roleDescription: string;
	requirements: string;
	/** Satu-satunya field yang boleh null. */
	benefits: string | null;
	createdAt: string;
	updatedAt: string;
};

/**
 * Body POST. Perhatikan: relasi dikirim sebagai `departmentId` /
 * `employmentTypeId` (uuid), BUKAN objek nested seperti di response.
 */
export type JobInput = {
	jobTitle: string;
	departmentId: string;
	location: string;
	employmentTypeId: string;
	status: JobStatus;
	roleDescription: string;
	requirements: string;
	/** Tidak dikirim → tersimpan null di server. */
	benefits?: string;
};

/** Body PATCH: semua opsional; hanya `benefits` yang boleh di-null-kan. */
export type JobUpdateInput = Partial<Omit<JobInput, "benefits">> & {
	benefits?: string | null;
};

export type JobListParams = {
	/** Cari di jobTitle, location, ATAU nama department (ILIKE %search%). */
	search?: string;
	page?: number;
	limit?: number;
};

/** Hitungan job aktif per status — seluruh data, tidak terpengaruh paginasi/search. */
export type JobSummary = {
	total: number;
	open: number;
	closed: number;
	draft: number;
};

export async function listJobs(params?: JobListParams) {
	const res = await apiClient.get<ApiListSuccess<Job>>("/jobs", { params });
	return res.data; // { data, meta } — terurut createdAt desc
}

export async function getJobSummary() {
	const res = await apiClient.get<ApiSuccess<JobSummary>>("/jobs/summary");
	return res.data.data;
}

export async function getJob(id: string) {
	const res = await apiClient.get<ApiSuccess<Job>>(`/jobs/${id}`);
	return res.data.data;
}

export async function createJob(body: JobInput) {
	const res = await apiClient.post<ApiSuccess<Job>>("/jobs", body);
	return res.data.data;
}

export async function updateJob(id: string, body: JobUpdateInput) {
	const res = await apiClient.patch<ApiSuccess<Job>>(`/jobs/${id}`, body);
	return res.data.data;
}

export async function deleteJob(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/jobs/${id}`);
	return res.data.data;
}
