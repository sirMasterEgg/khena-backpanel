import {
	ActionIcon,
	Anchor,
	Box,
	Breadcrumbs,
	Button,
	Card,
	Container,
	Grid,
	Group,
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
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { type Delivery, dummyDeliveries } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DeliveryRow } from "./DeliveryRow";
import {
	addWeeks,
	formatWeekRange,
	getWeekDays,
	getWeekStart,
	isSameDay,
} from "./weeks";

export function DeliveriesPage() {
	usePageTitle("Deliveries");
	const navigate = useNavigate();

	const today = useMemo(() => new Date(), []);
	const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

	const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

	// Pengiriman yang tanggalnya jatuh di dalam minggu yang sedang dilihat.
	const weekDeliveries = useMemo(() => {
		const weekEnd = dayjs(weekStart).add(6, "day");
		return dummyDeliveries.filter((d) => {
			const date = dayjs(d.date);
			return (
				!date.isBefore(dayjs(weekStart), "day") && !date.isAfter(weekEnd, "day")
			);
		});
	}, [weekStart]);

	// Overdue = belum delivered dan tanggalnya sebelum hari ini. Global,
	// tidak terikat minggu yang sedang dilihat.
	const overdue = useMemo(
		() =>
			dummyDeliveries.filter(
				(d) =>
					d.status !== "delivered" &&
					dayjs(d.date).isBefore(dayjs(today), "day"),
			),
		[today],
	);

	// Kelompokkan pengiriman minggu ini per hari (key = ISO tanggal).
	const deliveriesByDay = useMemo(() => {
		const map = new Map<string, Delivery[]>();
		for (const d of weekDeliveries) {
			const key = dayjs(d.date).format("YYYY-MM-DD");
			const list = map.get(key) ?? [];
			list.push(d);
			map.set(key, list);
		}
		return map;
	}, [weekDeliveries]);

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
						value={weekDeliveries.length}
						subtitle="Pengiriman terjadwal"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconAlertTriangle size={20} />}
						label="Overdue"
						value={overdue.length}
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
							<DeliveryRow key={d.id} delivery={d} />
						))}
					</Stack>
				</Card>
			)}

			{/* Kartu minggu berjalan. */}
			<Card withBorder>
				<Text fw={600} mb="md">
					Week of {formatWeekRange(weekStart)}
				</Text>
				<SimpleGrid cols={{ base: 1, sm: 2, lg: 7 }} spacing="md">
					{weekDays.map((day) => {
						const key = dayjs(day).format("YYYY-MM-DD");
						const items = deliveriesByDay.get(key) ?? [];
						const isToday = isSameDay(day, today);
						return (
							<Stack key={key} gap="sm">
								<Box
									p="xs"
									bg={isToday ? "dark" : "gray.1"}
									c={isToday ? "white" : undefined}
									style={{ borderRadius: "var(--mantine-radius-sm)" }}
								>
									<Text size="sm" fw={600} ta="center">
										{dayjs(day).format("ddd D")}
									</Text>
								</Box>
								{items.length > 0 ? (
									<Stack gap="md">
										{items.map((d) => (
											<DeliveryRow key={d.id} delivery={d} />
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
			</Card>
		</Container>
	);
}
