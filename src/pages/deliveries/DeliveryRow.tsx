import { Badge, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconChevronRight, IconTruck } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import type { Delivery } from "@/data/dummy";

interface DeliveryRowProps {
	delivery: Delivery;
}

/** Satu baris pengiriman — dipakai di kartu Overdue maupun grid mingguan. */
export function DeliveryRow({ delivery }: DeliveryRowProps) {
	const navigate = useNavigate();

	return (
		<Group
			gap="sm"
			wrap="nowrap"
			style={{ cursor: "pointer" }}
			onClick={() => navigate(`/orders/${delivery.orderId}`)}
		>
			<ThemeIcon size="lg" variant="light" color="gray">
				<IconTruck size={18} />
			</ThemeIcon>

			<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
				<Text fw={600} truncate>
					{delivery.customerName}
				</Text>
				<Text size="sm" c="dimmed" truncate>
					{delivery.orderId} · {delivery.city}
				</Text>
				{delivery.timeSlot && (
					<Text size="xs" c="dimmed">
						{delivery.timeSlot}
					</Text>
				)}
			</Stack>

			{delivery.status === "delivered" ? (
				<Badge color="green" variant="light">
					Delivered
				</Badge>
			) : (
				<IconChevronRight size={18} color="var(--mantine-color-dimmed)" />
			)}
		</Group>
	);
}
