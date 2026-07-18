import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { queryClient } from "@/config/queryClient";
import { useBootstrapAuth } from "@/features/auth/useBootstrapAuth";
import { Router } from "@/router";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@tabler/icons-react";

/** Restore sesi (refresh + me) sekali saat app mount, di atas Router. */
function AuthGate({ children }: { children: ReactNode }) {
	useBootstrapAuth();
	return <>{children}</>;
}

export function App() {
	return (
		<MantineProvider defaultColorScheme="light">
			<Notifications />
			<ModalsProvider>
				<QueryClientProvider client={queryClient}>
					<AuthGate>
						<Router />
					</AuthGate>
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</ModalsProvider>
		</MantineProvider>
	);
}
