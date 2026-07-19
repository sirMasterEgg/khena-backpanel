import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/stores/authStore";

/**
 * Kebalikan dari RequireAuth: membungkus halaman tamu (/sign-in). User yang
 * sudah login tidak boleh membukanya dan langsung diarahkan ke "/".
 */
export function GuestOnly() {
	const status = useAuthStore((state) => state.status);

	if (status === "authenticated") {
		return <Navigate to="/" replace />;
	}

	return <Outlet />;
}
