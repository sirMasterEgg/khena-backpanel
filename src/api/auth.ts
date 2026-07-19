import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";
import type { Admin } from "@/stores/authStore";

export async function getCsrf() {
	const res =
		await apiClient.get<ApiSuccess<{ csrfToken: string }>>("/auth/csrf");
	return res.data.data;
}

export async function login(body: { email: string; password: string }) {
	const res = await apiClient.post<
		ApiSuccess<{ accessToken: string; admin: Admin }>
	>("/auth/login", body);
	return res.data.data;
}

export async function refresh() {
	const res =
		await apiClient.post<ApiSuccess<{ accessToken: string }>>("/auth/refresh");
	return res.data.data;
}

export async function getMe() {
	const res = await apiClient.get<ApiSuccess<Admin>>("/auth/me");
	return res.data.data;
}

export async function logout() {
	const res = await apiClient.post<ApiSuccess<"OK">>("/auth/logout");
	return res.data.data;
}
