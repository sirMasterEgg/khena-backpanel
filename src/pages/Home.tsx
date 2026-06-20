import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { usePageTitle } from "@/hooks/usePageTitle";

export function Home() {
	usePageTitle("Home");

	return (
		<Container py="xl">
			<Stack gap="lg">
				<Title order={1}>Welcome to Khena Backpanel</Title>
				<Text>
					Project sudah siap dengan struktur clean architecture dan stack React
					modern.
				</Text>
				<Stack gap="xs">
					<Text fw={500}>Setup yang sudah selesai:</Text>
					<ul>
						<li>React + Vite + TypeScript</li>
						<li>React Router untuk navigasi</li>
						<li>Zustand untuk state management</li>
						<li>TanStack Query untuk data fetching</li>
						<li>Mantine UI untuk komponen</li>
						<li>Biome untuk linting & formatting</li>
						<li>Path alias (@/*) untuk import lebih baik</li>
					</ul>
				</Stack>
				<Button>Next Step</Button>
			</Stack>
		</Container>
	);
}
