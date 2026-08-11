import {
	Button,
	Card,
	Grid,
	Group,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";

interface HowItWorksCardProps {
	onGetTemplate: () => void;
	loading?: boolean;
	disabled?: boolean;
}

const STEPS = [
	{
		number: 1,
		title: "Download template",
		description: "Get the CSV file with the right columns.",
	},
	{
		number: 2,
		title: "Fill in your orders",
		description: "One row per item. Same order ID groups into one order.",
	},
	{
		number: 3,
		title: "Save as CSV and import",
		description: "Upload it back here — we'll match every SKU.",
	},
];

/** Kartu panduan 3 langkah, murni presentasional (tidak fetch apa pun). */
export function HowItWorksCard({
	onGetTemplate,
	loading,
	disabled,
}: HowItWorksCardProps) {
	return (
		<Card withBorder p="lg" mb="xl" bg="var(--mantine-color-gray-0)">
			<Group justify="space-between" align="center" wrap="nowrap">
				<Grid flex={1}>
					{STEPS.map((step) => (
						<Grid.Col key={step.number} span={{ base: 12, md: 4 }}>
							<Group gap="sm" wrap="nowrap">
								<ThemeIcon radius="xl" size="lg" variant="light">
									{step.number}
								</ThemeIcon>
								<Stack gap={2}>
									<Text fw={600} size="sm">
										{step.title}
									</Text>
									<Text size="xs" c="dimmed">
										{step.description}
									</Text>
								</Stack>
							</Group>
						</Grid.Col>
					))}
				</Grid>
				<Button
					variant="default"
					leftSection={<IconDownload size={16} />}
					loading={loading}
					disabled={disabled}
					onClick={onGetTemplate}
				>
					Get template
				</Button>
			</Group>
		</Card>
	);
}
