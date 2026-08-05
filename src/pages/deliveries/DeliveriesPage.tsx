import {
	ActionIcon,
	Anchor,
	Box,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconCalendar,
	IconChevronLeft,
	IconChevronRight,
	IconTruck,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import {
	getDeliveryStats,
	listOverdueDeliveries,
	listWeeklyDeliveries,
} from "@/api/deliveries";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DeliveryRow } from "./DeliveryRow";
import {
	addWeeks,
	formatWeekRange,
	getWeekStart,
	isSameDay,
	toApiDate,
} from "./weeks";

export function DeliveriesPage() {
	usePageTitle("Deliveries");
	const navigate = useNavigate();

	const today = useMemo(() => new Date(), []);
	const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

	const start = toApiDate(weekStart);
	const end = toApiDate(dayjs(weekStart).add(6, "day").toDate());

	const statsQuery = useQuery({
		queryKey: ["deliveries", "stats"],
		queryFn: getDeliveryStats,
	});

	const overdueQuery = useQuery({
		queryKey: ["deliveries", "overdue"],
		queryFn: listOverdueDeliveries,
	});

	const weekQuery = useQuery({
		queryKey: ["deliveries", "week", start],
		queryFn: () => listWeeklyDeliveries({ start, end }),
		// Data minggu lama tetap terlihat saat pindah minggu (tidak berkedip kosong).
		placeholderData: (prev) => prev,
	});

	const stats = statsQuery.data;
	const overdue = overdueQuery.data ?? [];
	// PERHATIKAN `.days` — response /deliveries adalah objek, bukan array.
	const days = weekQuery.data?.days ?? [];

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/deliveries")}>
					Deliveries
				</Anchor>
				<Text size="sm" c="dimmed">
					Weekly schedule
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Deliveries"
				subtitle="Jadwal pengiriman mingguan"
				actions={
					<Group gap="xs">
						<Button
							variant="default"
							onClick={() => setWeekStart(getWeekStart(new Date()))}
						>
							Today
						</Button>
						<ActionIcon
							variant="default"
							size="lg"
							aria-label="Minggu sebelumnya"
							onClick={() => setWeekStart((w) => addWeeks(w, -1))}
						>
							<IconChevronLeft size={18} />
						</ActionIcon>
						<ActionIcon
							variant="default"
							size="lg"
							aria-label="Minggu berikutnya"
							onClick={() => setWeekStart((w) => addWeeks(w, 1))}
						>
							<IconChevronRight size={18} />
						</ActionIcon>
					</Group>
				}
			/>

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconTruck size={20} />}
						label="This week"
						value={stats?.thisWeek ?? "—"}
						subtitle="Minggu berjalan"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconAlertTriangle size={20} />}
						label="Overdue"
						value={stats?.overdue ?? "—"}
						subtitle="Terlambat & belum dikirim"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconCalendar size={20} />}
						label="Week of"
						value={formatWeekRange(weekStart)}
						subtitle="Rentang minggu ditampilkan"
					/>
				</Grid.Col>
			</Grid>

			{/* Kartu Overdue — hanya muncul bila ada yang terlambat. */}
			{overdue.length > 0 && (
				<Card
					withBorder
					mb="xl"
					style={{ borderLeft: "3px solid var(--mantine-color-red-6)" }}
				>
					<Text fw={600} mb="md">
						Overdue — schedule or deliver
					</Text>
					<Stack gap="md">
						{overdue.map((d) => (
							<DeliveryRow
								key={d.id}
								orderId={d.id}
								invoiceNumber={d.invoiceNumber}
								customerName={d.customer.name}
								city={d.city}
								status={d.status}
								daysOverdue={d.daysOverdue}
							/>
						))}
					</Stack>
				</Card>
			)}

			{/* Kartu minggu berjalan. */}
			<Card withBorder>
				<Text fw={600} mb="md">
					Week of {formatWeekRange(weekStart)}
				</Text>
				{weekQuery.isLoading ? (
					<Center py="xl">
						<Loader />
					</Center>
				) : weekQuery.isError ? (
					<Text c="red" ta="center" py="xl">
						{getApiErrorMessage(weekQuery.error)}
					</Text>
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 7 }} spacing="md">
						{days.map((day) => {
							const isToday = isSameDay(dayjs(day.date).toDate(), today);
							return (
								<Stack key={day.date} gap="sm">
									<Box
										p="xs"
										bg={isToday ? "dark" : "gray.1"}
										c={isToday ? "white" : undefined}
										style={{ borderRadius: "var(--mantine-radius-sm)" }}
									>
										<Text size="sm" fw={600} ta="center">
											{dayjs(day.date).format("ddd D")}
										</Text>
									</Box>
									{day.deliveries.length > 0 ? (
										<Stack gap="md">
											{day.deliveries.map((d) => (
												<DeliveryRow
													key={d.id}
													orderId={d.id}
													invoiceNumber={d.invoiceNumber}
													customerName={d.customer.name}
													city={d.shippingDetail.city}
													status={d.status}
													timeSlot={d.shippingDetail.timeSlot}
												/>
											))}
										</Stack>
									) : (
										<Text c="dimmed" ta="center">
											—
										</Text>
									)}
								</Stack>
							);
						})}
					</SimpleGrid>
				)}
			</Card>
		</Container>
	);
}
