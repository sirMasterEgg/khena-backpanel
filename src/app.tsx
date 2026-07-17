import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/config/queryClient";
import { Router } from "@/router";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@tabler/icons-react";

export function App() {
	return (
		<MantineProvider defaultColorScheme="light">
			<Notifications />
			<ModalsProvider>
				<QueryClientProvider client={queryClient}>
					<Router />
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</ModalsProvider>
		</MantineProvider>
	);
}
