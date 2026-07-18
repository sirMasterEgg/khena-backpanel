import { Center, Loader } from "@mantine/core";
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "./authStore";

export function ProtectedRoute() {
	const accessToken = useAuthStore((s) => s.accessToken);
	const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

	if (isBootstrapping) {
		return (
			<Center h="100vh">
				<Loader />
			</Center>
		);
	}

	if (!accessToken) {
		return <Navigate to="/sign-in" replace />;
	}

	return <Outlet />;
}
