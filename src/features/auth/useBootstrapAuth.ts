import { useEffect } from "react";
import { getMe, refresh } from "./authApi";
import { useAuthStore } from "./authStore";

export function useBootstrapAuth() {
	const setSession = useAuthStore((s) => s.setSession);
	const clear = useAuthStore((s) => s.clear);
	const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

	useEffect(() => {
		let aktif = true;
		(async () => {
			try {
				const token = await refresh(); // pakai cookie refreshToken
				useAuthStore.getState().setAccessToken(token);
				const admin = await getMe();
				if (aktif) setSession(token, admin);
			} catch {
				if (aktif) clear(); // belum login / refresh token invalid
			} finally {
				if (aktif) setBootstrapping(false);
			}
		})();
		return () => {
			aktif = false;
		};
	}, [setSession, clear, setBootstrapping]);
}
