import { createTheme, MantineProvider, Modal } from "@mantine/core";
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

const theme = createTheme({
	components: {
		// Default Mantine (~200ms, transisi "pop") terasa lambat dan membuat
		// konten modal sempat terlihat "nyangkut" di state lama. Disamakan untuk
		// SEMUA modal, termasuk confirm modal dari ModalsProvider.
		Modal: Modal.extend({
			defaultProps: {
				transitionProps: { transition: "fade", duration: 120 },
			},
		}),
	},
});

export function App() {
	return (
		<MantineProvider defaultColorScheme="light" theme={theme}>
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
