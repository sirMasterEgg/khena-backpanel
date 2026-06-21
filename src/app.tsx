import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/config/queryClient";
import { Router } from "@/router";
import "@mantine/core/styles.css";
import "@tabler/icons-react";

export function App() {
	return (
		<MantineProvider defaultColorScheme="light">
			<QueryClientProvider client={queryClient}>
				<Router />
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</MantineProvider>
	);
}
