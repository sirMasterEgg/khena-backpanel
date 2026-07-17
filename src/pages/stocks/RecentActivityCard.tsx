import {
	Anchor,
	Badge,
	Card,
	Center,
	Group,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { IconCloudUpload, IconHistory, IconPencil } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { StockActivity } from "./stockTypes";

interface RecentActivityCardProps {
	activity: StockActivity[];
}

const DEFAULT_VISIBLE = 5;

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	hour: "2-digit",
	minute: "2-digit",
});

/** Format waktu aktivitas, mis. "16 Jul, 09:24". */
function formatWhen(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return dateTimeFormatter.format(date);
}

export function RecentActivityCard({ activity }: RecentActivityCardProps) {
	const [showAll, setShowAll] = useState(false);

	const sorted = useMemo(
		() =>
			[...activity].sort(
				(a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
			),
		[activity],
	);

	const visible = showAll ? sorted : sorted.slice(0, DEFAULT_VISIBLE);

	return (
		<Card withBorder>
			<Group justify="space-between" mb="md">
				<Title order={4}>Recent activity</Title>
				{sorted.length > DEFAULT_VISIBLE && (
					<Anchor
						size="sm"
						onClick={() => setShowAll((prev) => !prev)}
						component="button"
						type="button"
					>
						{showAll ? "Show less" : `View all (${sorted.length})`}
					</Anchor>
				)}
			</Group>

			{sorted.length === 0 ? (
				<Center py="xl">
					<Stack align="center" gap="sm">
						<IconHistory size={36} color="var(--mantine-color-gray-5)" />
						<Text c="dimmed">No stock activity yet</Text>
						<Text size="sm" c="dimmed">
							CSV imports and manual adjustments will be logged here.
						</Text>
					</Stack>
				</Center>
			) : (
				<Table.ScrollContainer minWidth={640}>
					<Table striped highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Source</Table.Th>
								<Table.Th>What changed</Table.Th>
								<Table.Th>By</Table.Th>
								<Table.Th>When</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{visible.map((item) => (
								<Table.Tr key={item.id}>
									<Table.Td>
										{item.source === "import" ? (
											<Badge
												variant="light"
												color="grape"
												leftSection={<IconCloudUpload size={12} />}
											>
												Import
											</Badge>
										) : (
											<Badge
												variant="light"
												color="blue"
												leftSection={<IconPencil size={12} />}
											>
												Manual
											</Badge>
										)}
									</Table.Td>
									<Table.Td>
										<Group gap={6} wrap="nowrap">
											<Text
												size="sm"
												fw={600}
												c={item.change >= 0 ? "green" : "red"}
											>
												{item.change >= 0 ? `+${item.change}` : item.change}
											</Text>
											<Text size="sm" c="dimmed">
												· {item.sku} · {item.reasonLabel}
											</Text>
										</Group>
									</Table.Td>
									<Table.Td>{item.by}</Table.Td>
									<Table.Td>{formatWhen(item.at)}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			)}
		</Card>
	);
}
