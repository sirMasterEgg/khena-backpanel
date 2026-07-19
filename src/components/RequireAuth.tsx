import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/stores/authStore";

/**
 * Guard halaman terproteksi. Bootstrap sesi sudah selesai di AuthBootstrap,
 * jadi di sini cukup memeriksa status akhir.
 */
export function RequireAuth() {
	const status = useAuthStore((state) => state.status);

	if (status === "authenticated") {
		return <Outlet />;
	}

	return <Navigate to="/sign-in" replace />;
}
