import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type AdministratorRoleRef = { id: string; name: string };

/** Item GET /administrators dan GET /administrators/:id. */
export type AdministratorListItem = {
	id: string;
	name: string;
	email: string;
	role: AdministratorRoleRef | null;
};

/** Response POST & PATCH — memakai `roleId`, BUKAN objek `role`. */
export type Administrator = {
	id: string;
	name: string;
	email: string;
	roleId: string | null;
};

export type AdministratorListParams = {
	search?: string;
	roleId?: string;
	page?: number;
	limit?: number;
};

export type AdministratorInput = {
	name: string;
	email: string;
	password: string;
	roleId: string;
};

/** Semua opsional. `password` HANYA disertakan kalau user benar-benar mengisinya. */
export type AdministratorPatchInput = Partial<AdministratorInput>;

export async function listAdministrators(params?: AdministratorListParams) {
	const res = await apiClient.get<ApiListSuccess<AdministratorListItem>>(
		"/administrators",
		{ params },
	);
	return res.data;
}

export async function getAdministrator(id: string) {
	const res = await apiClient.get<ApiSuccess<AdministratorListItem>>(
		`/administrators/${id}`,
	);
	return res.data.data;
}

export async function createAdministrator(body: AdministratorInput) {
	const res = await apiClient.post<ApiSuccess<Administrator>>(
		"/administrators",
		body,
	);
	return res.data.data;
}

export async function patchAdministrator(
	id: string,
	body: AdministratorPatchInput,
) {
	const res = await apiClient.patch<ApiSuccess<Administrator>>(
		`/administrators/${id}`,
		body,
	);
	return res.data.data;
}

export async function deleteAdministrator(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/administrators/${id}`);
	return res.data.data;
}
