import { Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconTruck } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import type { DeliveryStatus, DeliveryTimeSlot } from "@/api/deliveries";
import { StatusBadge } from "@/components/StatusBadge";

const TIME_SLOT_LABEL: Record<DeliveryTimeSlot, string> = {
	morning: "Morning",
	afternoon: "Afternoon",
	evening: "Evening",
};

interface DeliveryRowProps {
	/** sales_orders.id (uuid) — tujuan navigasi. BUKAN nomor invoice. */
	orderId: string;
	invoiceNumber: string;
	customerName: string | null;
	city: string | null;
	status: DeliveryStatus;
	timeSlot?: DeliveryTimeSlot | null;
	/** Hanya diisi di kartu Overdue. */
	daysOverdue?: number;
}

/** Satu baris pengiriman — dipakai di kartu Overdue maupun grid mingguan. */
export function DeliveryRow({
	orderId,
	invoiceNumber,
	customerName,
	city,
	status,
	timeSlot,
	daysOverdue,
}: DeliveryRowProps) {
	const navigate = useNavigate();

	return (
		<Group
			gap="sm"
			wrap="nowrap"
			style={{ cursor: "pointer" }}
			onClick={() => navigate(`/orders/${orderId}`)}
		>
			<ThemeIcon size="lg" variant="light" color="gray">
				<IconTruck size={18} />
			</ThemeIcon>

			<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
				<Text fw={600} truncate>
					{customerName ?? "—"}
				</Text>
				<Text size="sm" c="dimmed" truncate>
					#{invoiceNumber} · {city ?? "—"}
				</Text>
				{timeSlot && (
					<Text size="xs" c="dimmed">
						{TIME_SLOT_LABEL[timeSlot]}
					</Text>
				)}
				{daysOverdue != null && (
					<Text size="xs" c="red">
						{daysOverdue} hari terlambat
					</Text>
				)}
			</Stack>

			<StatusBadge status={status} variant="light" />
		</Group>
	);
}
