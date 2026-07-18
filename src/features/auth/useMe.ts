import { useQuery } from "@tanstack/react-query";
import { getMe } from "./authApi";
import { useAuthStore } from "./authStore";

/**
 * GET /auth/me — ambil data admin yang login. Hanya jalan saat ada accessToken.
 * Opsional: header memakai `admin` dari store, hook ini disediakan untuk konsumen
 * yang ingin memuat ulang data admin lewat react-query.
 */
export function useMe() {
	const accessToken = useAuthStore((s) => s.accessToken);

	return useQuery({
		queryKey: ["auth", "me"],
		queryFn: getMe,
		enabled: Boolean(accessToken),
	});
}
