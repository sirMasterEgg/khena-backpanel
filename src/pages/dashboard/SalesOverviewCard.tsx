import { LineChart } from "@mantine/charts";
import { Card, Group, Select, Skeleton, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import type { DashboardGroupBy, DashboardSalesPoint } from "@/api/dashboard";
import { formatIDR, formatIDRCompact } from "@/utils/format";
import { type DateRange, formatDateRange } from "./dashboardData";

const granularityOptions: { value: DashboardGroupBy; label: string }[] = [
	{ value: "day", label: "Daily" },
	{ value: "week", label: "Weekly" },
	{ value: "month", label: "Monthly" },
];

const labelFormat: Record<DashboardGroupBy, string> = {
	day: "MMM D",
	week: "MMM D",
	month: "MMM YYYY",
};

interface SalesOverviewCardProps {
	points: DashboardSalesPoint[];
	/** Rentang tanggal global; ditampilkan sebagai keterangan sub-judul. */
	dateRange: DateRange;
	groupBy: DashboardGroupBy;
	onGroupByChange: (value: DashboardGroupBy) => void;
	isLoading: boolean;
}

export function SalesOverviewCard({
	points,
	dateRange,
	groupBy,
	onGroupByChange,
	isLoading,
}: SalesOverviewCardProps) {
	const data = points.map((p) => ({
		label: dayjs(p.period).format(labelFormat[groupBy]),
		revenue: p.revenue,
	}));
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
						value={groupBy}
						onChange={(v) => v && onGroupByChange(v as DashboardGroupBy)}
						allowDeselect={false}
						comboboxProps={{ withinPortal: true }}
					/>
				</Group>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
				{isLoading ? (
					<Skeleton h={260} />
				) : data.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No sales in this period
					</Text>
				) : (
					<LineChart
						h={260}
						data={data}
						dataKey="label"
						series={[{ name: "revenue", label: "Sales", color: "blue.6" }]}
						valueFormatter={(v) => formatIDR(v)}
						yAxisProps={{ width: 72, tickFormatter: formatIDRCompact }}
					/>
				)}
			</Card.Section>
		</Card>
	);
}
