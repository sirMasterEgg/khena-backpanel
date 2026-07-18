import axios from "axios";
import { env } from "@/config/env";
import { refresh as refreshRequest } from "@/features/auth/authApi";
import {
	getAccessToken,
	setAccessTokenNonReactive,
	useAuthStore,
} from "@/features/auth/authStore";
import { readCsrfCookie } from "@/features/auth/csrf";

export const apiClient = axios.create({
	baseURL: env.apiBaseUrl,
	withCredentials: true, // WAJIB: agar cookie preSession/refreshToken/csrfToken ikut terkirim
	headers: {
		"Content-Type": "application/json",
	},
});

const MUTATING = new Set(["post", "put", "patch", "delete"]);

// Request interceptor: tempel Authorization + X-CSRF-Token (untuk method mengubah data).
apiClient.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers.set("Authorization", `Bearer ${token}`);
	}
	const method = (config.method ?? "get").toLowerCase();
	if (MUTATING.has(method) && !config.headers.has("X-CSRF-Token")) {
		const csrf = readCsrfCookie();
		if (csrf) config.headers.set("X-CSRF-Token", csrf);
	}
	return config;
});

// Satu proses refresh dipakai bersama oleh semua request yang menunggu.
let refreshPromise: Promise<string> | null = null;

function runRefresh(): Promise<string> {
	if (!refreshPromise) {
		refreshPromise = refreshRequest()
			.then((token) => {
				setAccessTokenNonReactive(token);
				return token;
			})
			.finally(() => {
				refreshPromise = null;
			});
	}
	return refreshPromise;
}

// Response interceptor: kalau 401, coba /auth/refresh sekali lalu ulangi request.
apiClient.interceptors.response.use(
	(res) => res,
	async (error) => {
		const original = error.config;
		const status = error.response?.status;
		const url: string = original?.url ?? "";

		const isAuthEndpoint =
			url.includes("/auth/refresh") || url.includes("/auth/login");

		if (status === 401 && original && !original._retry && !isAuthEndpoint) {
			original._retry = true;
			try {
				const token = await runRefresh();
				original.headers.set("Authorization", `Bearer ${token}`);
				return apiClient(original); // ulangi request asli
			} catch (refreshErr) {
				useAuthStore.getState().clear(); // sesi benar-benar habis
				return Promise.reject(refreshErr);
			}
		}
		return Promise.reject(error);
	},
);
