import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type Role = {
	id: string;
	name: string;
	description: string | null;
	permissions: string[]; // permission CODE, bukan uuid
};

export type RoleListParams = { search?: string; page?: number; limit?: number };

export type RoleInput = {
	name: string;
	description?: string;
	permissions: string[];
};

export type RolePatchInput = {
	name?: string;
	description?: string | null;
	permissions?: string[]; // dikirim = REPLACE seluruh permission role
};

export async function listRoles(params?: RoleListParams) {
	const res = await apiClient.get<ApiListSuccess<Role>>("/roles", { params });
	return res.data;
}

export async function getRole(id: string) {
	const res = await apiClient.get<ApiSuccess<Role>>(`/roles/${id}`);
	return res.data.data;
}

export async function createRole(body: RoleInput) {
	const res = await apiClient.post<ApiSuccess<Role>>("/roles", body);
	return res.data.data;
}

export async function patchRole(id: string, body: RolePatchInput) {
	const res = await apiClient.patch<ApiSuccess<Role>>(`/roles/${id}`, body);
	return res.data.data;
}

export async function deleteRole(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/roles/${id}`);
	return res.data.data;
}
