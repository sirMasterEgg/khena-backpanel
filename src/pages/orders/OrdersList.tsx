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
	Loader,
	Pagination,
	Select,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
	IconChartBar,
	IconClock,
	IconCoin,
	IconDownload,
	IconReceipt,
	IconSearch,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, getBlobApiErrorMessage } from "@/api/client";
import {
	exportOrderSalesCsv,
	getOrderSalesStats,
	listOrderSales,
	type OrderSalesListParams,
	type OrderSalesStatus,
	type OrderSalesStatusFilter,
	updateOrderSalesStatus,
} from "@/api/orderSales";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { canViewPrices } from "@/config/permissions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { formatCurrency, formatDate } from "./format";
import { OrderRowActions } from "./OrderRowActions";
import { ShipOrderModal } from "./ShipOrderModal";
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

/** Nilai tab UI → nilai `status` API. */
const TAB_TO_STATUS: Record<
	Exclude<OrdersTab, "all">,
	OrderSalesStatusFilter
> = {
	awaiting: "awaiting_fulfillment",
	pending: "pending",
	processing: "processing",
	shipped: "shipped",
	completed: "completed",
	cancelled: "cancelled",
};

const SORT_OPTIONS = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "total", label: "Highest total" },
];

export function OrdersList() {
	usePageTitle("Orders");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<OrdersTab>("all");
	const [sortBy, setSortBy] = useState<OrderSalesListParams["sort"]>("newest");
	const [page, setPage] = useState(1);
	// Order yang sedang menunggu tracking number sebelum di-set ke "shipped".
	const [shipTarget, setShipTarget] = useState<string | null>(null);

	// Debounce supaya tidak request tiap keystroke.
	const [debouncedSearch] = useDebouncedValue(search, 300);

	const params: OrderSalesListParams = {
		search: debouncedSearch || undefined,
		status: tab === "all" ? undefined : TAB_TO_STATUS[tab],
		sort: sortBy,
		page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["orders", params],
		queryFn: () => listOrderSales(params),
	});
	const orders = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// queryKey diawali "orders" supaya satu invalidateQueries({ queryKey: ["orders"] })
	// menyegarkan list + stats + detail sekaligus.
	const statsQuery = useQuery({
		queryKey: ["orders", "stats"],
		queryFn: getOrderSalesStats,
	});
	const stats = statsQuery.data;

	// Jumlah kolom yang tampil (untuk colSpan empty state).
	const columnCount = canViewPrices ? 7 : 6;

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const statusMutation = useMutation({
		mutationFn: ({
			id,
			status,
			trackingNumber,
		}: {
			id: string;
			status: OrderSalesStatus;
			trackingNumber?: string;
		}) => updateOrderSalesStatus(id, { status, trackingNumber }),
		onSuccess: (updated) => {
			notify.success(
				`#${updated.invoiceNumber} → ${updated.status}`,
				"Status updated",
			);
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			setShipTarget(null);
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	// Transisi ke "shipped" wajib tracking number → buka modal dulu, jangan
	// kirim PATCH langsung (pasti gagal 400 tanpa itu).
	const handleChangeStatus = (id: string, status: OrderSalesStatus) => {
		if (status === "shipped") {
			setShipTarget(id);
			return;
		}
		statusMutation.mutate({ id, status });
	};

	const handleConfirmShip = (trackingNumber: string) => {
		if (!shipTarget) return;
		statusMutation.mutate({
			id: shipTarget,
			status: "shipped",
			trackingNumber,
		});
	};

	const handleView = (id: string) => navigate(`/orders/${id}`);

	const exportMutation = useMutation({
		mutationFn: () =>
			exportOrderSalesCsv({
				search: debouncedSearch || undefined,
				status: tab === "all" ? undefined : TAB_TO_STATUS[tab],
				sort: sortBy,
			}),
		onSuccess: ({ blob, filename }) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			notify.success("Orders berhasil di-export");
		},
		onError: async (err) => notify.error(await getBlobApiErrorMessage(err)),
	});

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
						loading={exportMutation.isPending}
						onClick={() => exportMutation.mutate()}
					>
						Export
					</Button>
				}
			/>

			{/* Stats Cards — dari GET /order-sales/stats. "—" selagi loading. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Total Revenue"
						value={stats ? formatCurrency(stats.totalRevenue) : "—"}
						subtitle="Completed orders"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconReceipt size={20} />}
						label="Total Orders"
						value={stats?.totalOrders ?? "—"}
						subtitle="All time"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconChartBar size={20} />}
						label="Avg. Order Value"
						value={stats ? formatCurrency(stats.averageOrderValue) : "—"}
						subtitle="Per order"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconClock size={20} />}
						label="Awaiting Fulfillment"
						value={stats?.awaitingFulfillment ?? "—"}
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
					{TAB_ORDER.map((value) => {
						const badgeValue =
							value === "all"
								? stats?.total.allOrders
								: value === "awaiting"
									? stats?.total.awaitingFulfillment
									: stats?.total[value];
						return (
							<Tabs.Tab
								key={value}
								value={value}
								rightSection={
									badgeValue !== undefined ? (
										<Badge size="sm" variant="light" circle>
											{badgeValue}
										</Badge>
									) : undefined
								}
							>
								{TAB_LABELS[value]}
							</Tabs.Tab>
						);
					})}
				</Tabs.List>
			</Tabs>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					<TextInput
						placeholder="Search by invoice number or customer"
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
							handleFilterChange(() =>
								setSortBy((val as OrderSalesListParams["sort"]) ?? "newest"),
							)
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
				{isLoading ? (
					<Center py="xl">
						<Loader />
					</Center>
				) : isError ? (
					<Text c="red" ta="center" py="xl">
						{getApiErrorMessage(error)}
					</Text>
				) : (
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
								{orders.length > 0 ? (
									orders.map((order) => {
										const firstVariant = order.items.productVariants[0];
										return (
											<Table.Tr
												key={order.id}
												style={{ cursor: "pointer" }}
												onClick={() => handleView(order.id)}
											>
												<Table.Td>
													<Stack gap={2}>
														<Text fw={500}>#{order.invoiceNumber}</Text>
														<Text size="xs" c="dimmed">
															{order.items.total} items
														</Text>
													</Stack>
												</Table.Td>
												<Table.Td>
													<Group gap="sm" wrap="nowrap">
														<CustomerAvatar name={order.customer ?? "?"} />
														<Text>{order.customer ?? "—"}</Text>
													</Group>
												</Table.Td>
												<Table.Td>
													<Group gap="sm" wrap="nowrap">
														<Avatar
															src={firstVariant?.imageUrl}
															radius="sm"
															size={40}
														/>
														<Stack gap={2}>
															<Text size="sm">{firstVariant?.name ?? "—"}</Text>
															{order.items.total > 1 && (
																<Text size="xs" c="dimmed">
																	+ {order.items.total - 1} more
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
														onCancel={() =>
															statusMutation.mutate({
																id: order.id,
																status: "cancelled",
															})
														}
													/>
												</Table.Td>
											</Table.Tr>
										);
									})
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
				)}

				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination value={page} onChange={setPage} total={totalPages} />
					</Group>
				)}
			</Card>

			<ShipOrderModal
				opened={shipTarget !== null}
				onClose={() => setShipTarget(null)}
				onConfirm={handleConfirmShip}
				loading={statusMutation.isPending}
			/>
		</Container>
	);
}
