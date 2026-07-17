import {
	Badge,
	Card,
	Group,
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
import { getPendingTasks } from "./dashboardData";

const counts = getPendingTasks();

type TaskRow = {
	title: string;
	count: number;
	icon: ReactNode;
	color: string;
	to: string;
};

const rows: TaskRow[] = [
	{
		title: "Orders awaiting fulfillment",
		count: counts.awaitingFulfillment,
		icon: <IconClock size={18} />,
		color: "yellow",
		to: "/orders?status=pending",
	},
	{
		title: "Out of stock products",
		count: counts.outOfStock,
		icon: <IconAlertTriangle size={18} />,
		color: "red",
		to: "/stocks",
	},
	{
		title: "Low stock products",
		count: counts.lowStock,
		icon: <IconAlertTriangle size={18} />,
		color: "orange",
		to: "/stocks",
	},
	{
		title: "Unread messages",
		count: counts.unreadMessages,
		icon: <IconMail size={18} />,
		color: "blue",
		to: "/messages",
	},
	{
		title: "Draft products",
		count: counts.draftProducts,
		icon: <IconFileText size={18} />,
		color: "gray",
		to: "/products?status=draft",
	},
];

export function PendingTasksCard() {
	const navigate = useNavigate();

	return (
		<Card withBorder h="100%">
			<Card.Section inheritPadding py="md">
				<Group justify="space-between">
					<Text fw={600}>Pending Tasks</Text>
					<Text
						component="button"
						type="button"
						onClick={() => navigate("/orders")}
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
					{counts.total > 0
						? `${counts.total} needs attention`
						: "You're all caught up"}
				</Text>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
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
			</Card.Section>
		</Card>
	);
}
