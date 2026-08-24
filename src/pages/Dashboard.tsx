import { Alert, Container, Grid, Skeleton, Text } from "@mantine/core";
import {
	IconAlertCircle,
	IconCurrencyDollar,
	IconMail,
	IconShoppingCart,
	IconUsers,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { type DashboardGroupBy, getDashboard } from "@/api/dashboard";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { canViewProfit } from "@/config/permissions";
import { useFilterParams } from "@/hooks/useFilterParams";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import {
	type DateRange,
	rangeForPeriod,
} from "@/pages/dashboard/dashboardData";
import { PendingTasksCard } from "@/pages/dashboard/PendingTasksCard";
import { PeriodFilter } from "@/pages/dashboard/PeriodFilter";
import { QuickActionsCard } from "@/pages/dashboard/QuickActionsCard";
import { RecentOrdersCard } from "@/pages/dashboard/RecentOrdersCard";
import { SalesOverviewCard } from "@/pages/dashboard/SalesOverviewCard";
import { TopProductsCard } from "@/pages/dashboard/TopProductsCard";
import { useAuthStore } from "@/stores/authStore";
import { formatIDR } from "@/utils/format";

const GROUP_BY_VALUES: DashboardGroupBy[] = ["day", "week", "month"];

export function Dashboard() {
	usePageTitle("Dashboard");

	// Default-nya dinamis (minggu berjalan) — tetap dihitung sekali per mount
	// supaya konsisten dipakai sebagai default useFilterParams maupun fallback.
	const [defaultFrom, defaultTo] = useMemo(() => rangeForPeriod("week"), []);

	const [filters, setFilters] = useFilterParams({
		from: defaultFrom,
		to: defaultTo,
		groupBy: "day",
	});

	// Aturan 2.5 — from/to harus tanggal valid dan from <= to, groupBy harus
	// salah satu nilai DashboardGroupBy. Kalau tidak, abaikan dan pakai default.
	const parsedFrom = dayjs(filters.from, "YYYY-MM-DD", true);
	const parsedTo = dayjs(filters.to, "YYYY-MM-DD", true);
	const rangeValid =
		parsedFrom.isValid() && parsedTo.isValid() && !parsedFrom.isAfter(parsedTo);
	// useMemo di sini BUKAN sekadar optimisasi — tanpa ini, dateRange adalah
	// array literal baru tiap render, sehingga efek sinkronisasi localRange di
	// bawah (yang depend ke dateRange) tidak pernah stabil dan memicu
	// "Maximum update depth exceeded".
	const dateRange: DateRange = useMemo(
		() => (rangeValid ? [filters.from, filters.to] : [defaultFrom, defaultTo]),
		[rangeValid, filters.from, filters.to, defaultFrom, defaultTo],
	);
	const groupBy: DashboardGroupBy = GROUP_BY_VALUES.includes(
		filters.groupBy as DashboardGroupBy,
	)
		? (filters.groupBy as DashboardGroupBy)
		: "day";

	// rangeValid diturunkan dari filters.from/to di setiap render, jadi cukup depend ke situ.
	// biome-ignore lint/correctness/useExhaustiveDependencies: <lihat komentar di atas>
	useEffect(() => {
		if (!rangeValid) {
			setFilters({ from: defaultFrom, to: defaultTo }, { replace: true });
		}
	}, [filters.from, filters.to, defaultFrom, defaultTo, setFilters]);

	// DatePickerInput butuh state lokal — commit ke URL baru terjadi setelah
	// KEDUA ujung rentang terpilih, supaya klik pertama tidak langsung
	// ter-overwrite balik ke default saat baca-ulang dari URL.
	const [localRange, setLocalRange] = useState<DateRange>(dateRange);
	useEffect(() => {
		setLocalRange(dateRange);
	}, [dateRange]);

	const handleRangeChange = (range: DateRange) => {
		setLocalRange(range);
		const [start, end] = range;
		if (start && end) setFilters({ from: start, to: end });
	};

	const [startDate, endDate] = dateRange;

	const { can } = usePermissions();
	const canRead = can("dashboard.read");
	const adminName = useAuthStore((s) => s.admin?.name);

	const summaryQuery = useQuery({
		queryKey: ["dashboard", "summary", { startDate, endDate, groupBy }],
		queryFn: () =>
			getDashboard({
				startDate: startDate ?? undefined,
				endDate: endDate ?? undefined,
				groupBy,
			}),
		// DatePickerInput type="range" sempat bernilai [tanggal, null] saat user
		// baru klik ujung pertama. Jangan menembak API di keadaan setengah itu.
		enabled: canRead && Boolean(startDate) && Boolean(endDate),
	});
	const summary = summaryQuery.data;

	type Stat = {
		key: string;
		icon: ReactNode;
		label: string;
		value: string | number;
	};

	const stats: Stat[] = [
		...(canViewProfit
			? [
					{
						key: "revenue",
						icon: <IconCurrencyDollar size={20} />,
						label: "Total Revenue",
						value: formatIDR(summary?.totalRevenue ?? 0),
					},
				]
			: []),
		{
			key: "orders",
			icon: <IconShoppingCart size={20} />,
			label: "Orders",
			value: (summary?.totalOrders ?? 0).toLocaleString("id-ID"),
		},
		{
			key: "customers",
			icon: <IconUsers size={20} />,
			label: "New Customers",
			value: (summary?.totalNewCustomers ?? 0).toLocaleString("id-ID"),
		},
		{
			key: "messages",
			icon: <IconMail size={20} />,
			label: "Contact Messages",
			value: (summary?.totalContactMessages ?? 0).toLocaleString("id-ID"),
		},
	];

	// Bagi rata di breakpoint besar: 4 kartu → span 3, 3 kartu → span 4.
	const lgSpan = 12 / stats.length;

	if (!canRead) {
		return (
			<Container size="xl" px="0">
				<Text c="dimmed">You don't have access to the dashboard.</Text>
			</Container>
		);
	}

	return (
		<Container size="xl" px="0">
			<PageHeader
				title={`Good morning, ${adminName ?? "there"}`}
				subtitle="Here's what's happening with your store today."
				actions={
					<PeriodFilter value={localRange} onChange={handleRangeChange} />
				}
			/>

			{summaryQuery.isError && (
				<Alert
					icon={<IconAlertCircle size={16} />}
					color="red"
					mb="md"
					title="Failed to load dashboard"
				>
					{getApiErrorMessage(summaryQuery.error)}
				</Alert>
			)}

			{/* Baris 2: kartu statistik */}
			<Grid mb="xl">
				{stats.map((stat) => (
					<Grid.Col
						key={stat.key}
						span={{ base: 12, sm: 6, md: 4, lg: lgSpan }}
					>
						<Skeleton visible={summaryQuery.isLoading}>
							<StatTile
								icon={stat.icon}
								label={stat.label}
								value={stat.value}
							/>
						</Skeleton>
					</Grid.Col>
				))}
			</Grid>

			{/* Baris 3: Quick Action horizontal */}
			<QuickActionsCard mb="md" />

			{/* Baris 4: chart + recent orders */}
			<Grid mb="md">
				<Grid.Col span={{ base: 12, lg: 8 }}>
					<SalesOverviewCard
						points={summary?.salesOverview ?? []}
						dateRange={dateRange}
						groupBy={groupBy}
						onGroupByChange={(val) => setFilters({ groupBy: val })}
						isLoading={summaryQuery.isLoading}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, lg: 4 }}>
					<RecentOrdersCard
						orders={summary?.recentOrders ?? []}
						isLoading={summaryQuery.isLoading}
					/>
				</Grid.Col>
			</Grid>

			{/* Baris 4: dua kolom */}
			<Grid>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<TopProductsCard
						products={summary?.topProducts ?? []}
						isLoading={summaryQuery.isLoading}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<PendingTasksCard
						counts={summary?.pendingTasks}
						isLoading={summaryQuery.isLoading}
					/>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
