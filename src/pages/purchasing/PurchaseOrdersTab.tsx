import {
	ActionIcon,
	Button,
	Card,
	Center,
	Group,
	Loader,
	Pagination,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconPlus,
	IconSearch,
	IconTrash,
	IconTruckDelivery,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import {
	deletePurchaseOrder,
	listPurchaseOrders,
	type PurchaseOrderStatus,
} from "@/api/purchaseOrders";
import { notify } from "@/components/notify";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "./format";
import { PurchaseOrderModal } from "./PurchaseOrderModal";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS: { value: string; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "draft", label: "Draft" },
	{ value: "ordered", label: "Ordered" },
	{ value: "received", label: "Received" },
	{ value: "cancelled", label: "Cancelled" },
];

interface PurchaseOrdersTabProps {
	/** Dikontrol dari PurchasingPage supaya tombol "New purchase order" di header bisa memicunya. */
	formOpened: boolean;
	onFormOpenedChange: (opened: boolean) => void;
}

export function PurchaseOrdersTab({
	formOpened,
	onFormOpenedChange,
}: PurchaseOrdersTabProps) {
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [editingId, setEditingId] = useState<string | null>(null);

	const params = {
		search: debouncedSearch || undefined,
		status:
			statusFilter === "all"
				? undefined
				: (statusFilter as PurchaseOrderStatus),
		page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["purchase-orders", params],
		queryFn: () => listPurchaseOrders(params),
	});

	const orders = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	const invalidatePurchaseOrders = () =>
		queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deletePurchaseOrder(id),
		onSuccess: () => {
			notify.success("Purchase order dihapus");
			invalidatePurchaseOrders();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const confirmDelete = (id: string, invoiceNumber: string) => {
		modals.openConfirmModal({
			title: "Delete purchase order",
			children: (
				<Text size="sm">
					Delete <strong>{invoiceNumber}</strong>? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(id),
		});
	};

	const openEdit = (id: string) => setEditingId(id);
	const closeModal = () => {
		onFormOpenedChange(false);
		setEditingId(null);
	};

	return (
		<>
			<Card withBorder mb="md">
				<Group justify="space-between">
					<TextInput
						placeholder="Search by invoice number or supplier"
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) =>
							handleFilterChange(() => setSearch(e.currentTarget.value))
						}
						w={280}
					/>
					<Select
						data={STATUS_OPTIONS}
						value={statusFilter}
						onChange={(val) =>
							handleFilterChange(() => setStatusFilter(val ?? "all"))
						}
						allowDeselect={false}
						leftSection={
							<Text size="sm" c="dimmed">
								Status:
							</Text>
						}
						leftSectionWidth={60}
						w={200}
					/>
				</Group>
			</Card>

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
					<Table.ScrollContainer minWidth={800}>
						<Table striped highlightOnHover verticalSpacing="sm">
							<Table.Thead>
								<Table.Tr>
									<Table.Th>PO</Table.Th>
									<Table.Th>Supplier</Table.Th>
									<Table.Th>Date</Table.Th>
									<Table.Th>Items</Table.Th>
									<Table.Th>Total</Table.Th>
									<Table.Th>Status</Table.Th>
									<Table.Th style={{ width: 48 }} />
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{orders.length > 0 ? (
									orders.map((order) => (
										<Table.Tr
											key={order.id}
											style={{ cursor: "pointer" }}
											onClick={() => openEdit(order.id)}
										>
											<Table.Td>
												<Text fw={500}>{order.invoiceNumber}</Text>
											</Table.Td>
											<Table.Td>{order.supplierName}</Table.Td>
											<Table.Td>{formatDate(order.orderDate)}</Table.Td>
											<Table.Td>{order.totalItems}</Table.Td>
											<Table.Td>
												<Text fw={700}>{formatCurrency(order.totalAmount)}</Text>
											</Table.Td>
											<Table.Td>
												<StatusBadge status={order.status} />
											</Table.Td>
											<Table.Td>
												{order.status !== "received" && (
													<ActionIcon
														variant="subtle"
														color="red"
														aria-label="Delete purchase order"
														onClick={(e) => {
															e.stopPropagation();
															confirmDelete(order.id, order.invoiceNumber);
														}}
													>
														<IconTrash size={16} />
													</ActionIcon>
												)}
											</Table.Td>
										</Table.Tr>
									))
								) : (
									<Table.Tr>
										<Table.Td colSpan={7}>
											<Center py="xl">
												<Stack align="center" gap="sm">
													<IconTruckDelivery
														size={36}
														color="var(--mantine-color-gray-5)"
													/>
													<Text c="dimmed">No purchase orders yet</Text>
													<Button
														variant="light"
														leftSection={<IconPlus size={16} />}
														onClick={() => onFormOpenedChange(true)}
													>
														New purchase order
													</Button>
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

			<PurchaseOrderModal
				opened={formOpened || Boolean(editingId)}
				purchaseOrderId={editingId ?? undefined}
				onClose={closeModal}
				onSuccess={invalidatePurchaseOrders}
			/>
		</>
	);
}
