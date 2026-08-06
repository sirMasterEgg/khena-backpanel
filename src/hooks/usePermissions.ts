import { useAuthStore } from "@/stores/authStore";

/** Izin efektif administrator yang sedang login (dari GET /auth/me). */
export function usePermissions() {
	const permissions = useAuthStore((state) => state.admin?.permissions);
	const can = (code: string) => (permissions ?? []).includes(code);
	return { permissions: permissions ?? [], can };
}
