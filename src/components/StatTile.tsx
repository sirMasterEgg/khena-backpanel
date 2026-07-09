import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import { IconTrendingUp } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface StatTileProps {
	icon: ReactNode;
	label: string;
	value: string | number;
	/** Teks kecil abu-abu di bawah value (opsional). */
	subtitle?: string;
	delta?: number;
}

export function StatTile({
	icon,
	label,
	value,
	subtitle,
	delta,
}: StatTileProps) {
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
			<Text size="xl" fw={700} mb={subtitle || delta !== undefined ? "xs" : 0}>
				{value}
			</Text>
			{subtitle && (
				<Text size="xs" c="dimmed">
					{subtitle}
				</Text>
			)}
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
