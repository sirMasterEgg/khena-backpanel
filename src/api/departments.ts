import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";

export type Department = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

/** Master read-only, TIDAK berpaginasi — response tanpa `meta`. Terurut name asc. */
export async function listDepartments() {
	const res = await apiClient.get<ApiSuccess<Department[]>>("/departments");
	return res.data.data;
}
