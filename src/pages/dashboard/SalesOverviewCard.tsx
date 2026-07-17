import { LineChart } from "@mantine/charts";
import { Card, Group, Select, Text } from "@mantine/core";
import { useState } from "react";
import { formatIDR, formatIDRCompact } from "@/utils/format";
import { getSalesOverview, type Period } from "./dashboardData";

const chartPeriodOptions: { value: Period; label: string }[] = [
	{ value: "week", label: "This Week" },
	{ value: "month", label: "This Month" },
	{ value: "quarter", label: "This Quarter" },
	{ value: "year", label: "This Year" },
];

interface SalesOverviewCardProps {
	/** Periode global; jadi nilai awal grafik. */
	period: Period;
}

export function SalesOverviewCard({ period }: SalesOverviewCardProps) {
	// Filter lokal grafik, terpisah dari filter global (sesuai desain).
	const [chartPeriod, setChartPeriod] = useState<Period>(period);
	const data = getSalesOverview(chartPeriod);

	return (
		<Card withBorder h="100%">
			<Card.Section inheritPadding py="md">
				<Group justify="space-between">
					<Text fw={600}>Sales Overview</Text>
					<Select
						size="xs"
						w={140}
						data={chartPeriodOptions}
						value={chartPeriod}
						onChange={(v) => v && setChartPeriod(v as Period)}
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
