import {
	Badge,
	Card,
	Group,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconClock,
	IconFileText,
	IconMail,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import type { DashboardPendingCounts } from "@/api/dashboard";

type TaskRow = {
	title: string;
	count: number;
	icon: ReactNode;
	color: string;
	to: string;
};

interface PendingTasksCardProps {
	counts?: DashboardPendingCounts;
	isLoading: boolean;
}

export function PendingTasksCard({ counts, isLoading }: PendingTasksCardProps) {
	const navigate = useNavigate();

	const rows: TaskRow[] = [
		{
			title: "Orders awaiting fulfillment",
			count: counts?.orderAwaitingFulfillment ?? 0,
			icon: <IconClock size={18} />,
			color: "yellow",
			to: "/orders?status=pending",
		},
		{
			title: "Out of stock products",
			count: counts?.outOfStockProducts ?? 0,
			icon: <IconAlertTriangle size={18} />,
			color: "red",
			to: "/stocks",
		},
		{
			title: "Low stock products",
			count: counts?.lowStockProducts ?? 0,
			icon: <IconAlertTriangle size={18} />,
			color: "orange",
			to: "/stocks",
		},
		{
			title: "Unread messages",
			count: counts?.unreadMessages ?? 0,
			icon: <IconMail size={18} />,
			color: "blue",
			to: "/messages",
		},
		{
			title: "Draft products",
			count: counts?.draftProducts ?? 0,
			icon: <IconFileText size={18} />,
			color: "gray",
			to: "/products?status=draft",
		},
	];

	const total = rows.reduce((sum, row) => sum + row.count, 0);

	return (
		<Card withBorder h="100%">
			<Card.Section inheritPadding py="md">
				<Group justify="space-between">
					<Text fw={600}>Pending Tasks</Text>
					<Text
						component="button"
						type="button"
						onClick={() => navigate("/pending-tasks")}
						c="blue"
						size="sm"
						fw={500}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 0,
						}}
					>
						View all
					</Text>
				</Group>
				<Text size="sm" c="dimmed" mt={4}>
					{total > 0 ? `${total} needs attention` : "You're all caught up"}
				</Text>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
				{isLoading ? (
					<Stack gap="xs">
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows, no stable id
							<Skeleton key={i} h={48} radius="sm" />
						))}
					</Stack>
				) : (
					<Stack gap="xs">
						{rows.map((row) => (
							<UnstyledButton
								key={row.title}
								onClick={() => navigate(row.to)}
								p="xs"
								style={{ borderRadius: "var(--mantine-radius-sm)" }}
							>
								<Group wrap="nowrap" justify="space-between">
									<Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
										<ThemeIcon variant="light" color={row.color} size="lg">
											{row.icon}
										</ThemeIcon>
										<Stack gap={0} style={{ minWidth: 0 }}>
											<Text size="sm" fw={500} truncate>
												{row.title}
											</Text>
											<Text size="xs" c="dimmed">
												{row.count} {row.count === 1 ? "item" : "items"}
											</Text>
										</Stack>
									</Group>
									<Badge color={row.color} variant="light">
										{row.count}
									</Badge>
								</Group>
							</UnstyledButton>
						))}
					</Stack>
				)}
			</Card.Section>
		</Card>
	);
}
