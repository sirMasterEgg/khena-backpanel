import { create } from "zustand";

export type Admin = {
	id: string;
	name: string;
	email: string;
	role: string | null;
};

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthState = {
	accessToken: string | null;
	admin: Admin | null;
	status: AuthStatus;
	setAuth: (accessToken: string, admin: Admin) => void;
	setAccessToken: (accessToken: string) => void;
	clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	accessToken: null,
	admin: null,
	status: "checking",
	setAuth: (accessToken, admin) =>
		set({ accessToken, admin, status: "authenticated" }),
	setAccessToken: (accessToken) => set({ accessToken }),
	clearAuth: () =>
		set({ accessToken: null, admin: null, status: "unauthenticated" }),
}));
