import {
	Avatar,
	Card,
	Group,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { Link, useNavigate } from "react-router";
import { StatusBadge } from "@/components/StatusBadge";
import { dummyOrders } from "@/data/dummy";
import { formatIDR } from "@/utils/format";

const recentOrders = [...dummyOrders]
	.sort((a, b) => b.date.localeCompare(a.date))
	.slice(0, 5);

export function RecentOrdersCard() {
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
				{recentOrders.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No orders yet
					</Text>
				) : (
					<Stack gap="xs">
						{recentOrders.map((order) => (
							<UnstyledButton
								key={order.id}
								onClick={() => navigate(`/orders/${order.id}`)}
								p="xs"
								style={{ borderRadius: "var(--mantine-radius-sm)" }}
							>
								<Group wrap="nowrap" justify="space-between">
									<Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
										<Avatar
											src={order.items[0]?.thumbnail}
											size={40}
											radius="sm"
										/>
										<Stack gap={2} style={{ minWidth: 0 }}>
											<Group gap="xs" wrap="nowrap">
												<Text size="sm" fw={500}>
													#{order.id}
												</Text>
												<StatusBadge status={order.status} size="sm" />
											</Group>
											<Text size="sm" truncate>
												{order.items[0]?.productName}
											</Text>
											<Text size="xs" c="dimmed">
												{order.date}
											</Text>
										</Stack>
									</Group>
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
