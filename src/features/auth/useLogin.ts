import { useMutation } from "@tanstack/react-query";
import { login } from "./authApi";
import { useAuthStore } from "./authStore";
import { bootstrapCsrf } from "./csrf";

interface LoginVars {
	email: string;
	password: string;
}

export function useLogin() {
	const setSession = useAuthStore((s) => s.setSession);

	return useMutation({
		mutationFn: async (vars: LoginVars) => {
			await bootstrapCsrf(); // set cookie csrfToken + preSession
			return login(vars); // kirim header X-CSRF-Token (dibaca dari cookie)
		},
		onSuccess: (data) => {
			setSession(data.accessToken, data.admin);
		},
	});
}
