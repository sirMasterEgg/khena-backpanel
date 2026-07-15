import {
	ActionIcon,
	Anchor,
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
	IconChevronRight,
	IconCoin,
	IconDownload,
	IconPlus,
	IconSearch,
	IconStar,
	IconUserPlus,
	IconUsers,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { type Customer, dummyCustomers } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { openAddCustomerModal } from "./AddCustomerModal";
import { CustomerAvatar } from "./CustomerAvatar";
import { formatCurrency, formatDate } from "./format";
import { SegmentBadge } from "./SegmentBadge";

const ITEMS_PER_PAGE = 10;

type SegmentTab = "all" | "vip" | "loyal" | "new";

const SEGMENT_DEFINITIONS: Record<SegmentTab, string> = {
	all: "All customers in your store.",
	vip: "Top spenders with the highest lifetime value.",
	loyal: "Repeat buyers with 3+ orders.",
	new: "Joined within the last 30 days.",
};

const SORT_OPTIONS = [
	{ value: "ltv-desc", label: "Highest LTV" },
	{ value: "ltv-asc", label: "Lowest LTV" },
	{ value: "recent", label: "Most recent order" },
	{ value: "orders-desc", label: "Most orders" },
];

/** Waktu (ms) sebuah lastOrderAt untuk pengurutan; null → paling lama. */
function orderTime(iso: string | null): number {
	return iso ? new Date(iso).getTime() : 0;
}

export function CustomersList() {
	usePageTitle("Customers");
	const navigate = useNavigate();

	// Mirror data dummy di state supaya "Add customer" bisa menambah baris.
	const [customers, setCustomers] = useState<Customer[]>(() => [
		...dummyCustomers,
	]);
	const [search, setSearch] = useState("");
	const [segmentTab, setSegmentTab] = useState<SegmentTab>("all");
	const [sortBy, setSortBy] = useState<string>("ltv-desc");
	const [page, setPage] = useState(1);

	const stats = useMemo(() => {
		const total = customers.length;
		const vip = customers.filter((c) => c.segment === "vip").length;
		const now = new Date();
		const newThisMonth = customers.filter((c) => {
			const joined = new Date(c.joinedAt);
			return (
				joined.getFullYear() === now.getFullYear() &&
				joined.getMonth() === now.getMonth()
			);
		}).length;
		const totalLtv = customers.reduce((sum, c) => sum + c.lifetimeValue, 0);
		const avgLtv = total > 0 ? Math.round(totalLtv / total) : 0;
		return { total, vip, newThisMonth, avgLtv };
	}, [customers]);

	const segmentCounts = useMemo(
		() => ({
			all: customers.length,
			vip: customers.filter((c) => c.segment === "vip").length,
			loyal: customers.filter((c) => c.segment === "loyal").length,
			new: customers.filter((c) => c.segment === "new").length,
		}),
		[customers],
	);

	const filtered = useMemo(() => {
		let result = [...customers];

		if (segmentTab !== "all") {
			result = result.filter((c) => c.segment === segmentTab);
		}

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
			);
		}

		switch (sortBy) {
			case "ltv-asc":
				result.sort((a, b) => a.lifetimeValue - b.lifetimeValue);
				break;
			case "recent":
				result.sort(
					(a, b) => orderTime(b.lastOrderAt) - orderTime(a.lastOrderAt),
				);
				break;
			case "orders-desc":
				result.sort((a, b) => b.ordersCount - a.ordersCount);
				break;
			default:
				result.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
				break;
		}

		return result;
	}, [customers, search, segmentTab, sortBy]);

	const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
	const paged = filtered.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE,
	);

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const handleAddCustomer = (customer: Customer) => {
		// Mutasikan sumber dummy supaya halaman detail juga menemukannya.
		dummyCustomers.unshift(customer);
		setCustomers([...dummyCustomers]);
		setSegmentTab("all");
		setPage(1);
		notify.success(`${customer.name} added`, "Customer added");
	};

	const handleExport = () => {
		// Placeholder: export belum diimplementasikan.
		notify.info("Export belum tersedia", "Export");
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/customers")}>
					Customers
				</Anchor>
				<Text size="sm" c="dimmed">
					All Customers
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Customers"
				subtitle="Manage your customers and their lifetime value"
				actions={
					<Group gap="sm">
						<Button
							variant="default"
							leftSection={<IconDownload size={16} />}
							onClick={handleExport}
						>
							Export
						</Button>
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={() => openAddCustomerModal(handleAddCustomer)}
						>
							Add Customer
						</Button>
					</Group>
				}
			/>

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconUsers size={20} />}
						label="Total Customers"
						value={stats.total}
						subtitle="All time"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStar size={20} />}
						label="VIP Customers"
						value={stats.vip}
						subtitle="High value"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconUserPlus size={20} />}
						label="New This Month"
						value={stats.newThisMonth}
						delta={12}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Avg. Lifetime Value"
						value={formatCurrency(stats.avgLtv)}
						subtitle="Per customer"
					/>
				</Grid.Col>
			</Grid>

			{/* Segment Tabs */}
			<Tabs
				value={segmentTab}
				onChange={(val) =>
					handleFilterChange(() => setSegmentTab((val as SegmentTab) ?? "all"))
				}
				mb="xs"
			>
				<Tabs.List>
					{(Object.keys(SEGMENT_DEFINITIONS) as SegmentTab[]).map((tab) => (
						<Tabs.Tab
							key={tab}
							value={tab}
							rightSection={
								<Badge size="sm" variant="light" circle>
									{segmentCounts[tab]}
								</Badge>
							}
						>
							{tab === "all"
								? "All"
								: tab === "vip"
									? "VIP"
									: tab[0].toUpperCase() + tab.slice(1)}
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs>
			<Text size="sm" c="dimmed" mb="md">
				{SEGMENT_DEFINITIONS[segmentTab]}
			</Text>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					<TextInput
						placeholder="Search by name or email"
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
						onChange={(val) => setSortBy(val ?? "ltv-desc")}
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
								<Table.Th>Customer</Table.Th>
								<Table.Th>Email</Table.Th>
								<Table.Th>Orders</Table.Th>
								<Table.Th>Lifetime Value</Table.Th>
								<Table.Th>Last order</Table.Th>
								<Table.Th>Segment</Table.Th>
								<Table.Th style={{ width: 48 }} />
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{paged.length > 0 ? (
								paged.map((customer) => (
									<Table.Tr
										key={customer.id}
										style={{ cursor: "pointer" }}
										onClick={() => navigate(`/customers/${customer.id}`)}
									>
										<Table.Td>
											<Group gap="sm" wrap="nowrap">
												<CustomerAvatar
													name={customer.name}
													color={customer.avatarColor}
												/>
												<Stack gap={2}>
													<Group gap={6} wrap="nowrap">
														<Text fw={500}>{customer.name}</Text>
														{customer.hasDataIssue && (
															<IconAlertTriangle
																size={14}
																color="var(--mantine-color-yellow-6)"
															/>
														)}
													</Group>
													<Text size="xs" c="dimmed">
														Joined {formatDate(customer.joinedAt)}
													</Text>
												</Stack>
											</Group>
										</Table.Td>
										<Table.Td>{customer.email || "—"}</Table.Td>
										<Table.Td>{customer.ordersCount}</Table.Td>
										<Table.Td>
											<Text fw={700}>
												{formatCurrency(customer.lifetimeValue)}
											</Text>
										</Table.Td>
										<Table.Td>{formatDate(customer.lastOrderAt)}</Table.Td>
										<Table.Td>
											<SegmentBadge segment={customer.segment} />
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
												<IconUsers
													size={36}
													color="var(--mantine-color-gray-5)"
												/>
												<Text c="dimmed">No customers found</Text>
												<Button
													variant="light"
													leftSection={<IconPlus size={16} />}
													onClick={() =>
														openAddCustomerModal(handleAddCustomer)
													}
												>
													Add Customer
												</Button>
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
