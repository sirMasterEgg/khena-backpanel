import { apiClient } from "@/config/apiClient";

/** Baca nilai cookie `csrfToken` dari document.cookie. Return null kalau tidak ada. */
export function readCsrfCookie(): string | null {
	const match = document.cookie
		.split("; ")
		.find((row) => row.startsWith("csrfToken="));
	return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

/**
 * GET /auth/csrf — set cookie csrfToken (+ preSession kalau anonim).
 * Dipanggil sebelum login. Return csrfToken dari body sebagai fallback.
 */
export async function bootstrapCsrf(): Promise<string> {
	const res = await apiClient.get<{ data: { csrfToken: string } }>(
		"/auth/csrf",
	);
	return res.data.data.csrfToken;
}
