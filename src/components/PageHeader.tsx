import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
	return (
		<Group justify="space-between" mb="lg">
			<Stack gap="xs">
				<Title order={2}>{title}</Title>
				{subtitle && <Text c="dimmed">{subtitle}</Text>}
			</Stack>
			{actions && <div>{actions}</div>}
		</Group>
	);
}
