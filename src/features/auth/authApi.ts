import { apiClient } from "@/config/apiClient";
import type { Admin } from "./authStore";
import { readCsrfCookie } from "./csrf";

interface LoginPayload {
	email: string;
	password: string;
}

interface LoginResponse {
	accessToken: string;
	admin: Admin;
}

/** POST /auth/login — WAJIB kirim header X-CSRF-Token (dari cookie csrfToken). */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
	const csrf = readCsrfCookie();
	const res = await apiClient.post<{ data: LoginResponse }>(
		"/auth/login",
		payload,
		{ headers: csrf ? { "X-CSRF-Token": csrf } : {} },
	);
	return res.data.data;
}

/** POST /auth/refresh — pakai cookie refreshToken (otomatis). Tanpa Authorization. */
export async function refresh(): Promise<string> {
	const res = await apiClient.post<{ data: { accessToken: string } }>(
		"/auth/refresh",
	);
	return res.data.data.accessToken;
}

/** GET /auth/me — butuh Bearer token (ditempel interceptor). */
export async function getMe(): Promise<Admin> {
	const res = await apiClient.get<{ data: Admin }>("/auth/me");
	return res.data.data;
}

/** POST /auth/logout — butuh Bearer + X-CSRF-Token. Idempotent. */
export async function logout(): Promise<void> {
	const csrf = readCsrfCookie();
	await apiClient.post("/auth/logout", null, {
		headers: csrf ? { "X-CSRF-Token": csrf } : {},
	});
}
