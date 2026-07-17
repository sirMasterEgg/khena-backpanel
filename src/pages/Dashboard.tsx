import { Container, Grid } from "@mantine/core";
import {
	IconCurrencyDollar,
	IconEye,
	IconMail,
	IconShoppingCart,
	IconUsers,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { canViewProfit } from "@/config/permissions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getSummary, type Period } from "@/pages/dashboard/dashboardData";
import { PendingTasksCard } from "@/pages/dashboard/PendingTasksCard";
import { PeriodFilter } from "@/pages/dashboard/PeriodFilter";
import { QuickActionsCard } from "@/pages/dashboard/QuickActionsCard";
import { RecentOrdersCard } from "@/pages/dashboard/RecentOrdersCard";
import { SalesOverviewCard } from "@/pages/dashboard/SalesOverviewCard";
import { TopProductsCard } from "@/pages/dashboard/TopProductsCard";
import { formatIDR } from "@/utils/format";

export function Dashboard() {
	usePageTitle("Dashboard");

	const [period, setPeriod] = useState<Period>("week");
	const summary = getSummary(period);
	const deltaLabel = "vs last period";

	type Stat = {
		key: string;
		icon: ReactNode;
		label: string;
		value: string | number;
		delta: number;
	};

	const stats: Stat[] = [
		...(canViewProfit
			? [
					{
						key: "revenue",
						icon: <IconCurrencyDollar size={20} />,
						label: "Total Revenue",
						value: formatIDR(summary.revenue.value),
						delta: summary.revenue.delta,
					},
				]
			: []),
		{
			key: "orders",
			icon: <IconShoppingCart size={20} />,
			label: "Orders",
			value: summary.orders.value.toLocaleString("id-ID"),
			delta: summary.orders.delta,
		},
		{
			key: "customers",
			icon: <IconUsers size={20} />,
			label: "New Customers",
			value: summary.newCustomers.value.toLocaleString("id-ID"),
			delta: summary.newCustomers.delta,
		},
		{
			key: "views",
			icon: <IconEye size={20} />,
			label: "Page Views",
			value: summary.pageViews.value.toLocaleString("id-ID"),
			delta: summary.pageViews.delta,
		},
		{
			key: "messages",
			icon: <IconMail size={20} />,
			label: "Contact Messages",
			value: summary.contactMessages.value,
			delta: summary.contactMessages.delta,
		},
	];

	// Bagi rata di breakpoint besar: 5 kartu → span 2.4, 4 kartu → span 3.
	const lgSpan = 12 / stats.length;

	return (
		<Container size="xl" px="0">
			<PageHeader
				title="Good morning, Knox"
				subtitle="Here's what's happening with your store today."
				actions={<PeriodFilter value={period} onChange={setPeriod} />}
			/>

			{/* Baris 2: kartu statistik */}
			<Grid mb="xl">
				{stats.map((stat) => (
					<Grid.Col
						key={stat.key}
						span={{ base: 12, sm: 6, md: 4, lg: lgSpan }}
					>
						<StatTile
							icon={stat.icon}
							label={stat.label}
							value={stat.value}
							delta={stat.delta}
							deltaLabel={deltaLabel}
						/>
					</Grid.Col>
				))}
			</Grid>

			{/* Baris 3: Quick Action horizontal */}
			<QuickActionsCard mb="md" />

			{/* Baris 4: chart + recent orders */}
			<Grid mb="md">
				<Grid.Col span={{ base: 12, lg: 8 }}>
					<SalesOverviewCard period={period} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, lg: 4 }}>
					<RecentOrdersCard />
				</Grid.Col>
			</Grid>

			{/* Baris 4: dua kolom */}
			<Grid>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<TopProductsCard />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<PendingTasksCard />
				</Grid.Col>
			</Grid>
		</Container>
	);
}
