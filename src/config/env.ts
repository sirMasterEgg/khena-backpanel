const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
	throw new Error(
		"VITE_API_BASE_URL belum di-set. Cek file .env (lihat .env.example).",
	);
}

export const env = {
	apiBaseUrl,
} as const;