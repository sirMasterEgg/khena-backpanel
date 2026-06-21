import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import { IconTrendingUp } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface StatTileProps {
	icon: ReactNode;
	label: string;
	value: string | number;
	delta?: number;
}

export function StatTile({ icon, label, value, delta }: StatTileProps) {
	return (
		<Card withBorder p="md">
			<Group justify="space-between" mb="xs">
				<Text size="sm" c="dimmed" fw={500}>
					{label}
				</Text>
				<ThemeIcon size="lg" variant="light">
					{icon}
				</ThemeIcon>
			</Group>
			<Text size="xl" fw={700} mb="xs">
				{value}
			</Text>
			{delta !== undefined && (
				<Group gap="xs">
					<IconTrendingUp size={16} color="green" />
					<Text size="sm" c="green" fw={500}>
						+{delta}% vs last week
					</Text>
				</Group>
			)}
		</Card>
	);
}
