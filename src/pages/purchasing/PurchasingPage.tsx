import {
	ActionIcon,
	Anchor,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Stack,
	Table,
	Tabs,
	Text,
} from "@mantine/core";
import {
	IconBuildingStore,
	IconChevronRight,
	IconCoin,
	IconPlus,
	IconTruckDelivery,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import {
	dummyProducts,
	dummyPurchaseOrders,
	dummySuppliers,
	type Product,
	type PurchaseOrder,
	type Supplier,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatCurrency, formatDate } from "./format";
import {
	nextPoCode,
	openAddPurchaseOrderModal,
	openEditPurchaseOrderModal,
} from "./PurchaseOrderModal";
import { openAddSupplierModal, openEditSupplierModal } from "./SupplierModal";

type PurchasingTab = "orders" | "suppliers";

/** Status PO yang dihitung sebagai "sedang berjalan" untuk statistik. */
const ON_ORDER_STATUSES: PurchaseOrder["status"][] = ["ordered", "partial"];

export function PurchasingPage() {
	usePageTitle("Purchasing");
	const navigate = useNavigate();

	const [tab, setTab] = useState<PurchasingTab>("orders");
	// Mirror data dummy di state supaya add/edit/delete bisa mengubah baris.
	const [suppliers, setSuppliers] = useState<Supplier[]>(() => [
		...dummySuppliers,
	]);
	const [orders, setOrders] = useState<PurchaseOrder[]>(() => [
		...dummyPurchaseOrders,
	]);
	// Stok produk ditampung di state supaya "Receive & add stock" memicu render.
	const [products, setProducts] = useState<Product[]>(() => [...dummyProducts]);

	const stats = useMemo(() => {
		const onOrder = orders.filter((o) => ON_ORDER_STATUSES.includes(o.status));
		const onOrderValue = onOrder.reduce((sum, o) => sum + o.total, 0);
		return {
			onOrder: onOrder.length,
			onOrderValue,
			suppliers: suppliers.length,
		};
	}, [orders, suppliers]);

	/** Cari nama supplier dari id (untuk kolom Supplier di tabel PO). */
	const supplierName = (id: number) =>
		suppliers.find((s) => s.id === id)?.name ?? "—";

	// ----- Handler Supplier -----

	const handleAddSupplier = () => {
		openAddSupplierModal((supplier) => {
			// Mutasikan sumber dummy supaya konsisten dengan pola Customers.
			dummySuppliers.unshift(supplier);
			setSuppliers([...dummySuppliers]);
			notify.success(`${supplier.name} added`, "Supplier added");
		});
	};

	const handleEditSupplier = (supplier: Supplier) => {
		openEditSupplierModal(
			supplier,
			(updated) => {
				setSuppliers((prev) =>
					prev.map((s) => (s.id === updated.id ? updated : s)),
				);
				notify.success(`${updated.name} updated`, "Supplier updated");
			},
			(target) => {
				setSuppliers((prev) => prev.filter((s) => s.id !== target.id));
				notify.success(`${target.name} deleted`, "Supplier deleted");
			},
		);
	};

	// ----- Handler Purchase Order -----

	/** Simpan PO: update kalau sudah ada, insert kalau baru. */
	const upsertOrder = (order: PurchaseOrder) => {
		setOrders((prev) =>
			prev.some((o) => o.id === order.id)
				? prev.map((o) => (o.id === order.id ? order : o))
				: [order, ...prev],
		);
	};

	/** Terima PO: tambah stok tiap produk sesuai qty, simpan PO, tampilkan toast. */
	const handleReceiveOrder = (order: PurchaseOrder) => {
		setProducts((prev) =>
			prev.map((p) => {
				const line = order.lineItems?.find((it) => it.productId === p.id);
				return line ? { ...p, stock: p.stock + line.qty } : p;
			}),
		);
		upsertOrder(order);
		notify.success(
			`${order.code} received — stock updated`,
			"Purchase order received",
		);
	};

	const handleNewOrder = () => {
		const code = nextPoCode(orders);
		openAddPurchaseOrderModal(
			code,
			suppliers,
			products,
			(order) => {
				setOrders((prev) => [order, ...prev]);
				notify.success(`${order.code} created`, "Purchase order created");
			},
			handleReceiveOrder,
		);
	};

	const handleEditOrder = (order: PurchaseOrder) => {
		openEditPurchaseOrderModal(
			order,
			suppliers,
			products,
			(updated) => {
				setOrders((prev) =>
					prev.map((o) => (o.id === updated.id ? updated : o)),
				);
				notify.success(`${updated.code} updated`, "Purchase order updated");
			},
			handleReceiveOrder,
			(target) => {
				setOrders((prev) => prev.filter((o) => o.id !== target.id));
				notify.success(`${target.code} deleted`, "Purchase order deleted");
			},
		);
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/purchasing")}>
					Purchasing
				</Anchor>
			</Breadcrumbs>

			<PageHeader
				title="Purchasing"
				subtitle="Manage purchase orders and suppliers"
				actions={
					tab === "orders" ? (
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={handleNewOrder}
						>
							New purchase order
						</Button>
					) : (
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={handleAddSupplier}
						>
							Add supplier
						</Button>
					)
				}
			/>

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconTruckDelivery size={20} />}
						label="On order"
						value={stats.onOrder}
						subtitle="Ordered & partial"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="On-order value"
						value={formatCurrency(stats.onOrderValue)}
						subtitle="Open commitments"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconBuildingStore size={20} />}
						label="Suppliers"
						value={stats.suppliers}
						subtitle="Total suppliers"
					/>
				</Grid.Col>
			</Grid>

			{/* Section Tabs */}
			<Tabs
				value={tab}
				onChange={(val) => setTab((val as PurchasingTab) ?? "orders")}
				mb="md"
			>
				<Tabs.List>
					<Tabs.Tab value="orders">Purchase Orders</Tabs.Tab>
					<Tabs.Tab value="suppliers">Suppliers</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			{/* Content Card */}
			<Card withBorder>
				{tab === "orders" ? (
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
											onClick={() => handleEditOrder(order)}
										>
											<Table.Td>
												<Text fw={500}>{order.code}</Text>
											</Table.Td>
											<Table.Td>{supplierName(order.supplierId)}</Table.Td>
											<Table.Td>{formatDate(order.date)}</Table.Td>
											<Table.Td>{order.items}</Table.Td>
											<Table.Td>
												<Text fw={700}>{formatCurrency(order.total)}</Text>
											</Table.Td>
											<Table.Td>
												<StatusBadge status={order.status} />
											</Table.Td>
											<Table.Td>
												<ActionIcon variant="subtle" color="gray">
													<IconChevronRight size={16} />
												</ActionIcon>
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
														onClick={handleNewOrder}
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
				) : (
					<Table.ScrollContainer minWidth={700}>
						<Table striped highlightOnHover verticalSpacing="sm">
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Supplier</Table.Th>
									<Table.Th>Contact</Table.Th>
									<Table.Th>Phone</Table.Th>
									<Table.Th>Email</Table.Th>
									<Table.Th style={{ width: 48 }} />
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{suppliers.length > 0 ? (
									suppliers.map((supplier) => (
										<Table.Tr
											key={supplier.id}
											style={{ cursor: "pointer" }}
											onClick={() => handleEditSupplier(supplier)}
										>
											<Table.Td>
												<Text fw={500}>{supplier.name}</Text>
											</Table.Td>
											<Table.Td>{supplier.contactPerson || "—"}</Table.Td>
											<Table.Td>{supplier.phone || "—"}</Table.Td>
											<Table.Td>{supplier.email || "—"}</Table.Td>
											<Table.Td>
												<ActionIcon variant="subtle" color="gray">
													<IconChevronRight size={16} />
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									))
								) : (
									<Table.Tr>
										<Table.Td colSpan={5}>
											<Center py="xl">
												<Stack align="center" gap="sm">
													<IconBuildingStore
														size={36}
														color="var(--mantine-color-gray-5)"
													/>
													<Text c="dimmed">No suppliers yet</Text>
													<Button
														variant="light"
														leftSection={<IconPlus size={16} />}
														onClick={handleAddSupplier}
													>
														Add supplier
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
			</Card>
		</Container>
	);
}
