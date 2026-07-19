import { Center, Loader } from "@mantine/core";
import { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import { getMe, refresh } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

/**
 * Dijalankan sekali di root router untuk memulihkan sesi saat app baru dimuat
 * atau di-reload. Karena access token hanya di memori, kita coba refresh
 * (pakai cookie refreshToken httpOnly) sebelum guard mana pun memutuskan
 * redirect — supaya user yang sudah punya sesi tidak berkedip ke /sign-in.
 */
export function AuthBootstrap() {
	const status = useAuthStore((state) => state.status);
	const bootstrapped = useRef(false);

	useEffect(() => {
		// Guard StrictMode: jangan bootstrap dua kali.
		if (bootstrapped.current) return;
		bootstrapped.current = true;

		if (useAuthStore.getState().status !== "checking") return;

		async function restoreSession() {
			try {
				const { accessToken } = await refresh();
				useAuthStore.getState().setAccessToken(accessToken);
				const admin = await getMe();
				useAuthStore.getState().setAuth(accessToken, admin);
			} catch {
				useAuthStore.getState().clearAuth();
			}
		}

		restoreSession();
	}, []);

	if (status === "checking") {
		return (
			<Center h="100vh">
				<Loader />
			</Center>
		);
	}

	return <Outlet />;
}
