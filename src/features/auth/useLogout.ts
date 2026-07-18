import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { queryClient } from "@/config/queryClient";
import { logout } from "./authApi";
import { useAuthStore } from "./authStore";

export function useLogout() {
	const navigate = useNavigate();
	const clear = useAuthStore((s) => s.clear);

	return useMutation({
		mutationFn: logout,
		// Logout idempotent: apa pun hasilnya, bersihkan sesi lokal.
		onSettled: () => {
			clear();
			queryClient.clear(); // buang cache data milik user lama
			navigate("/sign-in", { replace: true });
		},
	});
}
