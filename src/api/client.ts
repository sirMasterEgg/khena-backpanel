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

function getErrorBody(error: unknown): ApiErrorBody["error"] | undefined {
	if (error instanceof AxiosError) {
		return (error.response?.data as ApiErrorBody | undefined)?.error;
	}
	return undefined;
}

/**
 * Satu entri `error.details` dari Elysia. Bentuknya tidak dijamin stabil, jadi
 * semua field dibaca defensif.
 */
type ValidationDetail = {
	path?: string; // JSON pointer, mis. "/finish"
	message?: string;
	summary?: string;
};

/** "/finish" → "finish"; "/items/0/name" → "items.0.name". */
function pointerToField(path: string): string {
	return path.replace(/^\//, "").replace(/\//g, ".");
}

function getValidationDetails(
	body: ApiErrorBody["error"] | undefined,
): ValidationDetail[] {
	if (!Array.isArray(body?.details)) return [];
	return body.details.filter(
		(d): d is ValidationDetail => typeof d === "object" && d !== null,
	);
}

function messageFromErrorBody(body: ApiErrorBody["error"] | undefined): string {
	// 422 membalas message generik "validation failed"; detail aslinya ada di
	// `error.details` (contract.md bagian 1). Rangkai itu supaya user tahu
	// field mana yang salah, bukan cuma "validation failed".
	const messages = getValidationDetails(body)
		.map((d) => {
			const text = d.summary ?? d.message;
			if (!text) return null;
			const field = d.path ? pointerToField(d.path) : "";
			return field ? `${field}: ${text}` : text;
		})
		.filter((m): m is string => Boolean(m));

	if (messages.length > 0) return messages.join("\n");
	if (body?.message) return body.message;
	return "Terjadi kesalahan. Coba lagi.";
}

export function getApiErrorMessage(error: unknown): string {
	return messageFromErrorBody(getErrorBody(error));
}

/**
 * Versi async dari getApiErrorMessage untuk request `responseType: "blob"`
 * (mis. export CSV): saat server membalas error, `error.response.data` ikut
 * berupa Blob — bukan objek JSON — sehingga getApiErrorMessage biasa jatuh ke
 * pesan generik. Di sini Blob-nya dibaca dulu sebagai teks lalu di-parse.
 */
export async function getBlobApiErrorMessage(error: unknown): Promise<string> {
	const data = error instanceof AxiosError ? error.response?.data : undefined;
	if (data instanceof Blob) {
		try {
			const parsed = JSON.parse(await data.text()) as ApiErrorBody;
			return messageFromErrorBody(parsed.error);
		} catch {
			// Blob bukan JSON valid — jatuh ke jalur biasa di bawah.
		}
	}
	return getApiErrorMessage(error);
}

/**
 * Peta nama field → pesan, dari `error.details` sebuah response 422. Dipakai
 * form untuk menaruh error di field yang tepat lewat `setError`, bukan cuma
 * melempar toast. Mengembalikan objek kosong kalau error-nya bukan validasi.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
	const result: Record<string, string> = {};
	for (const detail of getValidationDetails(getErrorBody(error))) {
		const text = detail.summary ?? detail.message;
		if (!detail.path || !text) continue;
		const field = pointerToField(detail.path);
		// Entri pertama per field yang menang — biasanya yang paling spesifik.
		if (!(field in result)) result[field] = text;
	}
	return result;
}

export function getApiErrorCode(error: unknown): string | null {
	return getErrorBody(error)?.code ?? null;
}
