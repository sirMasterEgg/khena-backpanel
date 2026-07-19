import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody, ApiSuccess } from "@/api/types";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/authStore";

// 3a. Helper baca cookie
function readCookie(name: string): string | null {
	const match = document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${name}=`));
	return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// 3b. Instance axios
export const apiClient = axios.create({
	baseURL: env.apiBaseUrl, // sudah termasuk /api, contoh: http://localhost:3000/api
	withCredentials: true, // WAJIB agar cookie preSession/refreshToken/csrfToken ikut terkirim
});

// Endpoint auth itu sendiri: jangan pernah dipicu auto-refresh saat 401.
const AUTH_ENDPOINTS = [
	"/auth/login",
	"/auth/refresh",
	"/auth/logout",
	"/auth/csrf",
];

function isAuthEndpoint(url: string | undefined): boolean {
	if (!url) return false;
	return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

// 3c. Request interceptor
apiClient.interceptors.request.use((config) => {
	const { accessToken } = useAuthStore.getState();
	if (accessToken) {
		config.headers.set("Authorization", `Bearer ${accessToken}`);
	}

	const method = config.method?.toLowerCase();
	if (
		method === "post" ||
		method === "put" ||
		method === "patch" ||
		method === "delete"
	) {
		// Baca cookie csrfToken SETIAP KALI (jangan di-cache): server merotasi
		// nilainya setelah login/refresh.
		const csrfToken = readCookie("csrfToken");
		if (csrfToken) {
			config.headers.set("X-CSRF-Token", csrfToken);
		}
	}

	return config;
});

// 3d. Response interceptor (auto-refresh saat 401)

// Single-flight: hanya boleh ada SATU panggilan refresh yang berjalan.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
	if (!refreshPromise) {
		refreshPromise = apiClient
			.post<ApiSuccess<{ accessToken: string }>>("/auth/refresh")
			.then((res) => res.data.data.accessToken)
			.finally(() => {
				refreshPromise = null;
			});
	}
	return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

function handleSessionExpired() {
	useAuthStore.getState().clearAuth();
	window.location.assign("/sign-in");
}

apiClient.interceptors.response.use(
	(response) => response,
	async (error: AxiosError) => {
		const originalConfig = error.config as RetriableConfig | undefined;

		// 1. Bukan 401 → teruskan apa adanya.
		if (error.response?.status !== 401 || !originalConfig) {
			return Promise.reject(error);
		}

		// 2. 401 dari endpoint auth itu sendiri → jangan coba refresh (hindari loop).
		if (isAuthEndpoint(originalConfig.url)) {
			return Promise.reject(error);
		}

		// 4. Sudah pernah di-retry → sesi habis.
		if (originalConfig._retried) {
			handleSessionExpired();
			return Promise.reject(error);
		}

		// 3. Belum di-retry → coba refresh.
		originalConfig._retried = true;
		try {
			const newAccessToken = await runRefresh();
			useAuthStore.getState().setAccessToken(newAccessToken);
			originalConfig.headers.set("Authorization", `Bearer ${newAccessToken}`);
			return apiClient(originalConfig);
		} catch (refreshError) {
			handleSessionExpired();
			return Promise.reject(refreshError);
		}
	},
);

// 3e. Helper ekstrak pesan/kode error (dipakai komponen untuk notifikasi)
export function getApiErrorMessage(error: unknown): string {
	if (error instanceof AxiosError) {
		const body = error.response?.data as ApiErrorBody | undefined;
		if (body?.error?.message) return body.error.message;
	}
	return "Terjadi kesalahan. Coba lagi.";
}

export function getApiErrorCode(error: unknown): string | null {
	if (error instanceof AxiosError) {
		const body = error.response?.data as ApiErrorBody | undefined;
		return body?.error?.code ?? null;
	}
	return null;
}
