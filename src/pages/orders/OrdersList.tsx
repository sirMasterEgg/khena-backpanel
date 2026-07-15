import {
	Anchor,
	Avatar,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Pagination,
	Select,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconChartBar,
	IconClock,
	IconCoin,
	IconDownload,
	IconReceipt,
	IconSearch,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { canViewPrices } from "@/config/permissions";
import { dummyOrders } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { formatCurrency, formatDate } from "./format";
import { OrderRowActions } from "./OrderRowActions";
import type { Order, OrderStatus } from "./orderTypes";
import { StatusMenu } from "./StatusMenu";

const ITEMS_PER_PAGE = 10;

type OrdersTab =
	| "all"
	| "awaiting"
	| "pending"
	| "processing"
	| "shipped"
	| "completed"
	| "cancelled";

const TAB_LABELS: Record<OrdersTab, string> = {
	all: "All Orders",
	awaiting: "Awaiting fulfilment",
	pending: "Pending",
	processing: "Processing",
	shipped: "Shipped",
	completed: "Completed",
	cancelled: "Cancelled",
};

const TAB_ORDER: OrdersTab[] = [
	"all",
	"awaiting",
	"pending",
	"processing",
	"shipped",
	"completed",
	"cancelled",
];

const SORT_OPTIONS = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "total-desc", label: "Highest total" },
];

export function OrdersList() {
	usePageTitle("Orders");
	const navigate = useNavigate();

	// Mirror data dummy di state supaya perubahan status & order baru tampil langsung.
	const [orders, setOrders] = useState<Order[]>(() => [...dummyOrders]);
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<OrdersTab>("all");
	const [sortBy, setSortBy] = useState<string>("newest");
	const [page, setPage] = useState(1);

	const stats = useMemo(() => {
		const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
		const totalOrders = orders.length;
		const avgOrderValue =
			totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
		const awaitingFulfillment = orders.filter(
			(o) => o.status === "pending" || o.status === "processing",
		).length;
		return { totalRevenue, totalOrders, avgOrderValue, awaitingFulfillment };
	}, [orders]);

	const counts = useMemo(
		() => ({
			all: orders.length,
			awaiting: orders.filter(
				(o) => o.status === "pending" || o.status === "processing",
			).length,
			pending: orders.filter((o) => o.status === "pending").length,
			processing: orders.filter((o) => o.status === "processing").length,
			shipped: orders.filter((o) => o.status === "shipped").length,
			completed: orders.filter((o) => o.status === "completed").length,
			cancelled: orders.filter((o) => o.status === "cancelled").length,
		}),
		[orders],
	);

	const filtered = useMemo(() => {
		let result = [...orders];

		if (tab === "awaiting") {
			result = result.filter(
				(o) => o.status === "pending" || o.status === "processing",
			);
		} else if (tab !== "all") {
			result = result.filter((o) => o.status === tab);
		}

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter(
				(o) =>
					o.id.toLowerCase().includes(q) ||
					o.customerName.toLowerCase().includes(q),
			);
		}

		switch (sortBy) {
			case "oldest":
				result.sort(
					(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
				);
				break;
			case "total-desc":
				result.sort((a, b) => b.total - a.total);
				break;
			default:
				result.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				);
				break;
		}

		return result;
	}, [orders, search, tab, sortBy]);

	const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
	const paged = filtered.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE,
	);

	// Jumlah kolom yang tampil (untuk colSpan empty state).
	const columnCount = canViewPrices ? 7 : 6;

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const handleChangeStatus = (id: string, status: OrderStatus) => {
		setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
		notify.success(`#${id} marked as ${status}`, "Status updated");
	};

	const handleRefund = (id: string) => {
		setOrders((prev) =>
			prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)),
		);
	};

	const handleView = (id: string) => navigate(`/orders/${id}`);

	const handleExport = () => {
		notify.info("Export belum tersedia", "Export");
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/orders")}>
					Orders
				</Anchor>
				<Text size="sm" c="dimmed">
					All Orders
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Orders"
				subtitle="Track and fulfil your customer orders"
				actions={
					<Button
						variant="default"
						leftSection={<IconDownload size={16} />}
						onClick={handleExport}
					>
						Export
					</Button>
				}
			/>

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Total Revenue"
						value={formatCurrency(stats.totalRevenue)}
						subtitle="All orders"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconReceipt size={20} />}
						label="Total Orders"
						value={stats.totalOrders}
						subtitle="All time"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconChartBar size={20} />}
						label="Avg. Order Value"
						value={formatCurrency(stats.avgOrderValue)}
						subtitle="Per order"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconClock size={20} />}
						label="Awaiting Fulfillment"
						value={stats.awaitingFulfillment}
						subtitle="Pending + processing"
					/>
				</Grid.Col>
			</Grid>

			{/* Status Tabs */}
			<Tabs
				value={tab}
				onChange={(val) =>
					handleFilterChange(() => setTab((val as OrdersTab) ?? "all"))
				}
				mb="md"
			>
				<Tabs.List>
					{TAB_ORDER.map((value) => (
						<Tabs.Tab
							key={value}
							value={value}
							rightSection={
								<Badge size="sm" variant="light" circle>
									{counts[value]}
								</Badge>
							}
						>
							{TAB_LABELS[value]}
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					<TextInput
						placeholder="Search by order ID or customer"
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) =>
							handleFilterChange(() => setSearch(e.currentTarget.value))
						}
						w={280}
					/>
					<Select
						data={SORT_OPTIONS}
						value={sortBy}
						onChange={(val) =>
							handleFilterChange(() => setSortBy(val ?? "newest"))
						}
						allowDeselect={false}
						leftSection={
							<Text size="sm" c="dimmed">
								Sort by:
							</Text>
						}
						leftSectionWidth={70}
						w={240}
					/>
				</Group>
			</Card>

			{/* Table */}
			<Card withBorder>
				<Table.ScrollContainer minWidth={900}>
					<Table striped highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Order</Table.Th>
								<Table.Th>Customer</Table.Th>
								<Table.Th>Items</Table.Th>
								<Table.Th>Date</Table.Th>
								{canViewPrices && <Table.Th ta="right">Total</Table.Th>}
								<Table.Th>Status</Table.Th>
								<Table.Th style={{ width: 48 }}>Action</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{paged.length > 0 ? (
								paged.map((order) => (
									<Table.Tr
										key={order.id}
										style={{ cursor: "pointer" }}
										onClick={() => handleView(order.id)}
									>
										<Table.Td>
											<Stack gap={2}>
												<Group gap={6} wrap="nowrap">
													<Text fw={500}>#{order.id}</Text>
													{order.hasDataIssue && (
														<IconAlertTriangle
															size={14}
															color="var(--mantine-color-yellow-6)"
														/>
													)}
												</Group>
												<Text size="xs" c="dimmed">
													{order.items.length} items
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>
											<Group gap="sm" wrap="nowrap">
												<CustomerAvatar
													name={order.customerName}
													color={order.customerAvatarColor}
												/>
												<Text>{order.customerName}</Text>
											</Group>
										</Table.Td>
										<Table.Td>
											<Group gap="sm" wrap="nowrap">
												<Avatar
													src={order.items[0].thumbnail}
													radius="sm"
													size={40}
												/>
												<Stack gap={2}>
													<Text size="sm">{order.items[0].productName}</Text>
													{order.items.length > 1 && (
														<Text size="xs" c="dimmed">
															+ {order.items.length - 1} more
														</Text>
													)}
												</Stack>
											</Group>
										</Table.Td>
										<Table.Td>{formatDate(order.date)}</Table.Td>
										{canViewPrices && (
											<Table.Td>
												<Text fw={700} ta="right">
													{formatCurrency(order.total)}
												</Text>
											</Table.Td>
										)}
										<Table.Td onClick={(e) => e.stopPropagation()}>
											<StatusMenu
												status={order.status}
												onChange={(status) =>
													handleChangeStatus(order.id, status)
												}
											/>
										</Table.Td>
										<Table.Td onClick={(e) => e.stopPropagation()}>
											<OrderRowActions
												order={order}
												onView={() => handleView(order.id)}
												onChangeStatus={(status) =>
													handleChangeStatus(order.id, status)
												}
												onRefund={() => handleRefund(order.id)}
											/>
										</Table.Td>
									</Table.Tr>
								))
							) : (
								<Table.Tr>
									<Table.Td colSpan={columnCount}>
										<Center py="xl">
											<Stack align="center" gap="sm">
												<IconReceipt
													size={36}
													color="var(--mantine-color-gray-5)"
												/>
												<Text c="dimmed">No orders found</Text>
											</Stack>
										</Center>
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>

				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination value={page} onChange={setPage} total={totalPages} />
					</Group>
				)}
			</Card>
		</Container>
	);
}
