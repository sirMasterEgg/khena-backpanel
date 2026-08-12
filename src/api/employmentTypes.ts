import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";

export type EmploymentType = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

/** Master read-only, TIDAK berpaginasi — response tanpa `meta`. Terurut name asc. */
export async function listEmploymentTypes() {
	const res =
		await apiClient.get<ApiSuccess<EmploymentType[]>>("/employment-types");
	return res.data.data;
}
