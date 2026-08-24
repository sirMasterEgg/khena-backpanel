import {
	Anchor,
	Breadcrumbs,
	Button,
	Container,
	Grid,
	Tabs,
} from "@mantine/core";
import {
	IconBuildingStore,
	IconCoin,
	IconPlus,
	IconTruckDelivery,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getPurchaseOrderStats } from "@/api/purchaseOrders";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatCurrency } from "./format";
import { PurchaseOrdersTab } from "./PurchaseOrdersTab";
import { SuppliersTab } from "./SuppliersTab";

type PurchasingTab = "orders" | "suppliers";

export function PurchasingPage() {
	usePageTitle("Purchasing");
	const navigate = useNavigate();

	const { tab: tabParam } = useParams();
	const tab: PurchasingTab = tabParam === "suppliers" ? "suppliers" : "orders";
	const [ordersFormOpened, setOrdersFormOpened] = useState(false);
	const [suppliersFormOpened, setSuppliersFormOpened] = useState(false);

	const statsQuery = useQuery({
		queryKey: ["purchase-orders", "stats"],
		queryFn: getPurchaseOrderStats,
	});
	const stats = statsQuery.data;

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
							onClick={() => setOrdersFormOpened(true)}
						>
							New purchase order
						</Button>
					) : (
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={() => setSuppliersFormOpened(true)}
						>
							Add supplier
						</Button>
					)
				}
			/>

			{/* Stats Cards — dari GET /purchase-orders/stats. "—" selagi loading/gagal. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconTruckDelivery size={20} />}
						label="On order"
						value={stats?.onOrder ?? "—"}
						subtitle="Ordered"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="On-order value"
						value={stats ? formatCurrency(stats.onOrderValue) : "—"}
						subtitle="Open commitments"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconBuildingStore size={20} />}
						label="Suppliers"
						value={stats?.totalSuppliers ?? "—"}
						subtitle="Total suppliers"
					/>
				</Grid.Col>
			</Grid>

			{/* Section Tabs */}
			<Tabs
				value={tab}
				onChange={(val) => navigate(`/purchasing/${val ?? "orders"}`)}
				mb="md"
			>
				<Tabs.List>
					<Tabs.Tab value="orders">Purchase Orders</Tabs.Tab>
					<Tabs.Tab value="suppliers">Suppliers</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			{tab === "orders" ? (
				<PurchaseOrdersTab
					formOpened={ordersFormOpened}
					onFormOpenedChange={setOrdersFormOpened}
				/>
			) : (
				<SuppliersTab
					formOpened={suppliersFormOpened}
					onFormOpenedChange={setSuppliersFormOpened}
				/>
			)}
		</Container>
	);
}
