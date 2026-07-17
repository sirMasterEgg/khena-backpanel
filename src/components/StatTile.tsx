import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface StatTileProps {
	icon: ReactNode;
	label: string;
	value: string | number;
	/** Teks kecil abu-abu di bawah value (opsional). */
	subtitle?: string;
	delta?: number;
	/** Teks pembanding di samping delta. Default "vs last period". */
	deltaLabel?: string;
}

export function StatTile({
	icon,
	label,
	value,
	subtitle,
	delta,
	deltaLabel = "vs last period",
}: StatTileProps) {
	const isPositive = delta !== undefined && delta >= 0;
	const trendColor = isPositive ? "green" : "red";

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
					{isPositive ? (
						<IconTrendingUp size={16} color="var(--mantine-color-green-6)" />
					) : (
						<IconTrendingDown size={16} color="var(--mantine-color-red-6)" />
					)}
					<Text size="sm" c={trendColor} fw={500}>
						{isPositive ? `+${delta}%` : `${delta}%`} {deltaLabel}
					</Text>
				</Group>
			)}
		</Card>
	);
}
