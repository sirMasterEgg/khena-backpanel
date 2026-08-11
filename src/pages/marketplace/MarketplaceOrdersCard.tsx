import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Center,
	Group,
	Loader,
	Pagination,
	Stack,
	Table,
	Tabs,
	Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconBuildingStore,
	IconDownload,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import {
	deleteMarketplaceOrder,
	listMarketplaceOrders,
	type MarketplaceOrder,
	type MarketplaceOrderItem,
} from "@/api/marketplace";
import { notify } from "@/components/notify";
import { StatusBadge } from "@/components/StatusBadge";
import { usePermissions } from "@/hooks/usePermissions";
import { formatIDR } from "@/utils/format";
import {
	CHANNEL_META,
	channelLabel,
	isKnownChannel,
	normalizeChannel,
} from "./marketplaceChannels";

interface MarketplaceOrdersCardProps {
	/** "all" | "tokopedia" | "shopee" — dikontrol parent. */
	tab: string;
	onTabChange: (tab: string) => void;
	onDownloadTemplate: () => void;
}

/** Jumlah ORDER per halaman (bukan item) — lihat MarketplaceOrderListParams. */
const ITEMS_PER_PAGE = 10;

/** Satu baris tabel = satu item, tapi tetap membawa order induknya (untuk delete). */
type OrderRow = { order: MarketplaceOrder; item: MarketplaceOrderItem };

function channelColor(marketplace: string): string {
	const key = normalizeChannel(marketplace);
	return isKnownChannel(key) ? CHANNEL_META[key].color : "gray";
}

export function MarketplaceOrdersCard({
	tab,
	onTabChange,
	onDownloadTemplate,
}: MarketplaceOrdersCardProps) {
	const { can } = usePermissions();
	const canRead = can("marketplace.read");
	const canDelete = can("marketplace.delete");

	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);

	const params = {
		// Tab "all" → kirim undefined, JANGAN kirim string "all".
		marketplace: tab === "all" ? undefined : tab,
		page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["marketplace", "orders", params],
		queryFn: () => listMarketplaceOrders(params),
		enabled: canRead,
	});
	const orders = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// GET /marketplace/orders sekarang nested (1 objek per order, dengan
	// items[] di dalamnya) — diratakan lagi di sini jadi 1 baris tabel per
	// item, sesuai desain awal ("flat per item, jangan digrup"). Order
	// dengan 3 barang tetap tampil sebagai 3 baris.
	const rows: OrderRow[] = orders.flatMap((order) =>
		order.items.map((item) => ({ order, item })),
	);

	const handleTabChange = (val: string | null) => {
		setPage(1);
		onTabChange(val ?? "all");
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteMarketplaceOrder(id),
		onSuccess: () => {
			notify.success("Marketplace order deleted");
			queryClient.invalidateQueries({ queryKey: ["marketplace"] });
			// Stok dikembalikan oleh server → angka di halaman Stocks jadi basi.
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const confirmDelete = (order: MarketplaceOrder) => {
		modals.openConfirmModal({
			title: "Delete marketplace order",
			children: (
				<Text size="sm">
					Delete order <strong>{order.orderId}</strong> and{" "}
					<strong>all of its items</strong>? Stock will be returned. This action
					cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(order.id),
		});
	};

	return (
		<Card withBorder>
			<Group justify="space-between" mb="md">
				<Text fw={600}>Marketplace orders</Text>
				<Tabs value={tab} onChange={handleTabChange} variant="pills">
					<Tabs.List>
						<Tabs.Tab value="all">All</Tabs.Tab>
						<Tabs.Tab value="tokopedia">Tokopedia</Tabs.Tab>
						<Tabs.Tab value="shopee">Shopee</Tabs.Tab>
					</Tabs.List>
				</Tabs>
			</Group>

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
								<Table.Th>Marketplace</Table.Th>
								<Table.Th>Order ID</Table.Th>
								<Table.Th>Product</Table.Th>
								<Table.Th>Buyer</Table.Th>
								<Table.Th>Qty</Table.Th>
								<Table.Th>Revenue</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Date</Table.Th>
								<Table.Th style={{ width: 48 }} />
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{rows.length > 0 ? (
								rows.map(({ order, item }) => (
									<Table.Tr key={item.id}>
										<Table.Td>
											<Badge
												variant="light"
												color={channelColor(order.marketplace)}
											>
												{channelLabel(order.marketplace)}
											</Badge>
										</Table.Td>
										<Table.Td>
											<Text ff="monospace" size="sm">
												{order.orderId}
											</Text>
										</Table.Td>
										<Table.Td>
											<Stack gap={0}>
												<Text size="sm">{item.productName}</Text>
												<Text size="xs" c="dimmed">
													{item.variantSku}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>{order.buyerName}</Table.Td>
										<Table.Td>{item.quantity}</Table.Td>
										<Table.Td>{formatIDR(item.revenue)}</Table.Td>
										<Table.Td>
											{/* Response belum punya field status — semua order marketplace
											yang tercatat memang sudah selesai (issue.md §3.3). */}
											<StatusBadge status="completed" />
										</Table.Td>
										<Table.Td>
											{dayjs(order.date).format("DD MMM YYYY")}
										</Table.Td>
										<Table.Td>
											{canDelete && (
												<ActionIcon
													variant="subtle"
													color="red"
													onClick={() => confirmDelete(order)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											)}
										</Table.Td>
									</Table.Tr>
								))
							) : (
								<Table.Tr>
									<Table.Td colSpan={9}>
										<Center py="xl">
											<Stack align="center" gap="sm">
												<IconBuildingStore
													size={36}
													color="var(--mantine-color-gray-5)"
												/>
												<Text c="dimmed">
													{tab === "all"
														? "No marketplace orders yet"
														: "No orders from this marketplace"}
												</Text>
												{tab === "all" && (
													<Button
														variant="light"
														leftSection={<IconDownload size={16} />}
														onClick={onDownloadTemplate}
													>
														Download template
													</Button>
												)}
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
				<Center mt="md">
					<Pagination value={page} onChange={setPage} total={totalPages} />
				</Center>
			)}
		</Card>
	);
}
