import { Badge, Center, Group, Stack, Table, Text } from "@mantine/core";
import { IconCloudUpload, IconHistory, IconPencil } from "@tabler/icons-react";
import type { StockActivityItem } from "@/api/stocks";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

/** Format waktu aktivitas, mis. "16 Jul, 09:24". */
export function formatWhen(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return dateTimeFormatter.format(date);
}

interface StockActivityTableProps {
	items: StockActivityItem[];
}

export function StockActivityTable({ items }: StockActivityTableProps) {
	if (items.length === 0) {
		return (
			<Center py="xl">
				<Stack align="center" gap="sm">
					<IconHistory size={36} color="var(--mantine-color-gray-5)" />
					<Text c="dimmed">No stock activity yet</Text>
					<Text size="sm" c="dimmed">
						CSV imports and manual adjustments will be logged here.
					</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<Table.ScrollContainer minWidth={560}>
			<Table striped highlightOnHover verticalSpacing="sm" layout="fixed">
				<Table.Thead>
					<Table.Tr>
						<Table.Th style={{ width: 130 }}>Source</Table.Th>
						<Table.Th>What changed</Table.Th>
						<Table.Th style={{ width: 150, whiteSpace: "nowrap" }}>By</Table.Th>
						<Table.Th style={{ width: 110, whiteSpace: "nowrap" }}>
							When
						</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{items.map((item) => (
						<Table.Tr key={item.id}>
							<Table.Td style={{ whiteSpace: "nowrap" }}>
								{item.source === "ADJUSTMENT" ? (
									<Badge
										variant="light"
										color="blue"
										leftSection={<IconPencil size={12} />}
									>
										Manual
									</Badge>
								) : (
									<Badge
										variant="light"
										color="grape"
										leftSection={<IconCloudUpload size={12} />}
									>
										System
									</Badge>
								)}
							</Table.Td>
							<Table.Td>
								<Group gap={6} wrap="nowrap">
									<Text
										size="sm"
										fw={600}
										c={item.quantity >= 0 ? "green" : "red"}
									>
										{item.quantity >= 0 ? `+${item.quantity}` : item.quantity}
									</Text>
									<Text size="sm" c="dimmed">
										· {item.sku} · {item.reason ?? "—"}
									</Text>
								</Group>
							</Table.Td>
							<Table.Td>{item.by ?? "—"}</Table.Td>
							<Table.Td>{formatWhen(item.timestamp)}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</Table.ScrollContainer>
	);
}
