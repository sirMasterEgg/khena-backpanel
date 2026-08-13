import {
	Card,
	Group,
	Skeleton,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { Link, useNavigate } from "react-router";
import type { DashboardRecentOrder } from "@/api/dashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIDR } from "@/utils/format";

interface RecentOrdersCardProps {
	orders: DashboardRecentOrder[];
	isLoading: boolean;
}

export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
	const navigate = useNavigate();

	return (
		<Card withBorder h="100%">
			<Card.Section inheritPadding py="md">
				<Group justify="space-between">
					<Text fw={600}>Recent Orders</Text>
					<Text component={Link} to="/orders" c="blue" size="sm" fw={500}>
						View All
					</Text>
				</Group>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
				{isLoading ? (
					<Stack gap="xs">
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows, no stable id
							<Skeleton key={i} h={56} radius="sm" />
						))}
					</Stack>
				) : orders.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No orders yet
					</Text>
				) : (
					<Stack gap="xs">
						{orders.map((order) => (
							<UnstyledButton
								key={order.id}
								onClick={() => navigate(`/orders/${order.id}`)}
								p="xs"
								style={{ borderRadius: "var(--mantine-radius-sm)" }}
							>
								<Group wrap="nowrap" justify="space-between">
									<Stack gap={2} style={{ minWidth: 0 }}>
										<Group gap="xs" wrap="nowrap">
											<Text size="sm" fw={500}>
												{order.invoiceNumber}
											</Text>
											<StatusBadge status={order.status} size="sm" />
										</Group>
										<Text size="sm" truncate>
											{order.customerName ?? "Guest"}
										</Text>
										<Text size="xs" c="dimmed">
											{order.orderDate}
										</Text>
									</Stack>
									<Text size="sm" fw={600} style={{ whiteSpace: "nowrap" }}>
										{formatIDR(order.total)}
									</Text>
								</Group>
							</UnstyledButton>
						))}
					</Stack>
				)}
			</Card.Section>
		</Card>
	);
}
