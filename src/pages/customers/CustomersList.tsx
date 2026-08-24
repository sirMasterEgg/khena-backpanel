import {
	Anchor,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, getBlobApiErrorMessage } from "@/api/client";
import {
	type CustomerListParams,
	exportCustomersCsv,
	getCustomerStats,
	listCustomers,
} from "@/api/customers";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { useFilterParams } from "@/hooks/useFilterParams";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "./CustomerAvatar";
import { CustomerFormModal } from "./CustomerFormModal";
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
	{ value: "orders-desc", label: "Most orders" },
	{ value: "newest-joined", label: "Newest joined" },
	{ value: "name-az", label: "Name A-Z" },
];
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);
const SEGMENT_TABS: SegmentTab[] = ["all", "vip", "loyal", "new"];

/** Nilai dropdown sort UI → pasangan `sort` + `orderDir` untuk query API. */
const SORT_PARAMS: Record<
	string,
	{ sort: CustomerListParams["sort"]; orderDir: "asc" | "desc" }
> = {
	"ltv-desc": { sort: "ltv", orderDir: "desc" },
	"orders-desc": { sort: "totalOrder", orderDir: "desc" },
	"newest-joined": { sort: "joinedAt", orderDir: "desc" },
	"name-az": { sort: "name", orderDir: "asc" },
};

export function CustomersList() {
	usePageTitle("Customers");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [filters, setFilters] = useFilterParams({
		q: "",
		segment: "all",
		sort: "ltv-desc",
		page: 1,
	});
	const [formOpened, setFormOpened] = useState(false);

	// Aturan 2.5 — user bisa mengetik ?segment=ngawur atau ?sort=ngawur di address bar.
	const segmentTab: SegmentTab = SEGMENT_TABS.includes(
		filters.segment as SegmentTab,
	)
		? (filters.segment as SegmentTab)
		: "all";
	const sortBy: string = SORT_VALUES.includes(filters.sort)
		? filters.sort
		: "ltv-desc";

	// Resep search dari Batch 0.4.
	const [searchInput, setSearchInput] = useState(filters.q);
	const [debouncedInput] = useDebouncedValue(searchInput, 300);
	useEffect(() => {
		if (debouncedInput !== filters.q) {
			setFilters({ q: debouncedInput }, { replace: true });
		}
	}, [debouncedInput, filters.q, setFilters]);
	useEffect(() => {
		setSearchInput(filters.q);
	}, [filters.q]);

	const params: CustomerListParams = {
		search: filters.q || undefined,
		segment: segmentTab === "all" ? undefined : segmentTab,
		...SORT_PARAMS[sortBy],
		page: filters.page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["customers", params],
		queryFn: () => listCustomers(params),
	});

	const customers = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// Stats agregat untuk tile (GET /customers/stats).
	// queryKey diawali "customers" supaya ikut ter-refresh saat ada mutasi.
	const statsQuery = useQuery({
		queryKey: ["customers", "stats"],
		queryFn: getCustomerStats,
	});
	const stats = statsQuery.data;

	const invalidateCustomers = () =>
		queryClient.invalidateQueries({ queryKey: ["customers"] });

	const exportMutation = useMutation({
		mutationFn: exportCustomersCsv,
		onSuccess: ({ blob, filename }) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			notify.success("Customers berhasil di-export");
		},
		// responseType "blob" membuat body error juga berupa Blob — pakai helper
		// async khusus supaya pesan asli dari server tetap terbaca.
		onError: async (err) => notify.error(await getBlobApiErrorMessage(err)),
	});

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
							loading={exportMutation.isPending}
							onClick={() => exportMutation.mutate()}
						>
							Export
						</Button>
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={() => setFormOpened(true)}
						>
							Add Customer
						</Button>
					</Group>
				}
			/>

			{/* Stats Cards — dari GET /customers/stats. "—" selagi loading/gagal. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconUsers size={20} />}
						label="Total Customers"
						value={stats?.totalCustomers ?? "—"}
						subtitle="All time"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStar size={20} />}
						label="VIP Customers"
						value={stats?.vipCustomers ?? "—"}
						subtitle="High value"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconUserPlus size={20} />}
						label="New This Month"
						value={stats?.newThisMonth ?? "—"}
						subtitle="Last 30 days"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Avg. Lifetime Value"
						value={stats ? formatCurrency(stats.avgLifetimeValue) : "—"}
						subtitle="Per customer"
					/>
				</Grid.Col>
			</Grid>

			{/* Segment Tabs */}
			<Tabs
				value={segmentTab}
				onChange={(val) =>
					setFilters({ segment: (val as SegmentTab) ?? "all" })
				}
				mb="xs"
			>
				<Tabs.List>
					{(Object.keys(SEGMENT_DEFINITIONS) as SegmentTab[]).map((tab) => {
						// API tidak menyediakan hitungan per segment. Hanya tampilkan
						// badge untuk tab yang angkanya benar-benar ada dari /stats.
						const badgeValue =
							tab === "all"
								? stats?.totalCustomers
								: tab === "vip"
									? stats?.vipCustomers
									: tab === "new"
										? stats?.newThisMonth
										: undefined;
						return (
							<Tabs.Tab
								key={tab}
								value={tab}
								rightSection={
									badgeValue !== undefined ? (
										<Badge size="sm" variant="light" circle>
											{badgeValue}
										</Badge>
									) : undefined
								}
							>
								{tab === "all"
									? "All"
									: tab === "vip"
										? "VIP"
										: tab[0].toUpperCase() + tab.slice(1)}
							</Tabs.Tab>
						);
					})}
				</Tabs.List>
			</Tabs>
			<Text size="sm" c="dimmed" mb="md">
				{SEGMENT_DEFINITIONS[segmentTab]}
			</Text>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					<TextInput
						placeholder="Search by name, email, or phone"
						leftSection={<IconSearch size={16} />}
						value={searchInput}
						onChange={(e) => setSearchInput(e.currentTarget.value)}
						w={280}
					/>
					<Select
						data={SORT_OPTIONS}
						value={sortBy}
						onChange={(val) => setFilters({ sort: val ?? "ltv-desc" })}
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
								{customers.length > 0 ? (
									customers.map((customer) => (
										<Table.Tr
											key={customer.id}
											style={{ cursor: "pointer" }}
											onClick={() => navigate(`/customers/${customer.id}`)}
										>
											<Table.Td>
												<Group gap="sm" wrap="nowrap">
													<CustomerAvatar name={customer.name} />
													<Stack gap={2}>
														<Group gap={6} wrap="nowrap">
															<Text fw={500}>{customer.name}</Text>
															{(!customer.email || !customer.phone) && (
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
											<Table.Td>{customer.totalOrder}</Table.Td>
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
												<IconChevronRight
													size={16}
													color="var(--mantine-color-gray-5)"
												/>
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
														onClick={() => setFormOpened(true)}
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
				)}

				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination
							value={filters.page}
							onChange={(p) => setFilters({ page: p })}
							total={totalPages}
						/>
					</Group>
				)}
			</Card>

			<CustomerFormModal
				opened={formOpened}
				onClose={() => setFormOpened(false)}
				onSuccess={invalidateCustomers}
			/>
		</Container>
	);
}
