import { Button, Card, Container, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

interface PlaceholderPageProps {
	title: string;
	subtitle?: string;
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
	usePageTitle(title);

	return (
		<Container size="xl">
			<PageHeader title={title} subtitle={subtitle} />

			<Card withBorder>
				<Card.Section inheritPadding py="lg" pb="lg">
					<Stack align="center" gap="md">
						<div
							style={{
								width: "100px",
								height: "100px",
								borderRadius: "8px",
								backgroundColor: "#e9ecef",
							}}
						/>
						<div style={{ textAlign: "center" }}>
							<Text fw={600} size="lg" mb="xs">
								Coming soon
							</Text>
							<Text c="dimmed" size="sm">
								This page is being prepared and will be available soon.
							</Text>
						</div>
						<Button variant="light">Go Back</Button>
					</Stack>
				</Card.Section>
			</Card>
		</Container>
	);
}
