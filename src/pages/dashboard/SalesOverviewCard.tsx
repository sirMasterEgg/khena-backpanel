import { LineChart } from "@mantine/charts";
import { Card, Group, Select, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { formatIDR, formatIDRCompact } from "@/utils/format";
import {
	type DateRange,
	formatDateRange,
	getSalesOverview,
	type SalesGranularity,
} from "./dashboardData";

const granularityOptions: { value: SalesGranularity; label: string }[] = [
	{ value: "day", label: "Daily" },
	{ value: "week", label: "Weekly" },
	{ value: "month", label: "Monthly" },
];

interface SalesOverviewCardProps {
	/** Rentang tanggal global; ditampilkan sebagai keterangan & sumber titik grafik. */
	dateRange: DateRange;
}

export function SalesOverviewCard({ dateRange }: SalesOverviewCardProps) {
	// Granularitas sumbu-X grafik; jumlah titik diturunkan dari rentang tanggal.
	const [granularity, setGranularity] = useState<SalesGranularity>("day");
	const data = getSalesOverview(dateRange, granularity);
	const rangeLabel = formatDateRange(dateRange);

	return (
		<Card withBorder h="100%">
			<Card.Section inheritPadding py="md">
				<Group justify="space-between" wrap="nowrap">
					<Stack gap={2}>
						<Text fw={600}>Sales Overview</Text>
						{rangeLabel && (
							<Text size="xs" c="dimmed">
								{rangeLabel}
							</Text>
						)}
					</Stack>
					<Select
						size="xs"
						w={120}
						data={granularityOptions}
						value={granularity}
						onChange={(v) => v && setGranularity(v as SalesGranularity)}
						allowDeselect={false}
						comboboxProps={{ withinPortal: true }}
					/>
				</Group>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
				<LineChart
					h={260}
					data={data}
					dataKey="label"
					series={[{ name: "value", label: "Sales", color: "blue.6" }]}
					valueFormatter={(v) => formatIDR(v)}
					yAxisProps={{ width: 72, tickFormatter: formatIDRCompact }}
				/>
			</Card.Section>
		</Card>
	);
}
