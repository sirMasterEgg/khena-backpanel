import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";

export type Permission = {
	id: string;
	code: string;
	module: string;
	action: string;
	description: string | null;
};

/** GET /permissions — TANPA pagination, response `{ data: Permission[] }`. */
export async function listPermissions() {
	const res = await apiClient.get<ApiSuccess<Permission[]>>("/permissions");
	return res.data.data;
}
