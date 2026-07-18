import { create } from "zustand";

export interface Admin {
	id: string;
	name: string;
	email: string;
	role: string | null;
}

interface AuthState {
	accessToken: string | null;
	admin: Admin | null;
	/** true selama proses restore sesi awal (useBootstrapAuth) belum selesai */
	isBootstrapping: boolean;

	setAccessToken: (token: string | null) => void;
	setAdmin: (admin: Admin | null) => void;
	setSession: (token: string, admin: Admin) => void;
	clear: () => void;
	setBootstrapping: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	accessToken: null,
	admin: null,
	isBootstrapping: true,

	setAccessToken: (accessToken) => set({ accessToken }),
	setAdmin: (admin) => set({ admin }),
	setSession: (accessToken, admin) => set({ accessToken, admin }),
	clear: () => set({ accessToken: null, admin: null }),
	setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),
}));

/**
 * Akses accessToken di luar React (dipakai interceptor axios).
 * Zustand mendukung `getState()` untuk baca nilai terkini tanpa hook.
 */
export const getAccessToken = () => useAuthStore.getState().accessToken;
export const setAccessTokenNonReactive = (token: string | null) =>
	useAuthStore.setState({ accessToken: token });
