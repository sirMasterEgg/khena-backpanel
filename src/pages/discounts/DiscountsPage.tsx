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
	Loader,
	Menu,
	Pagination,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
} from "@mantine/core";
import { useClipboard, useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconClockExclamation,
	IconCoin,
	IconCopy,
	IconDots,
	IconEdit,
	IconPlus,
	IconSearch,
	IconTicket,
	IconTrash,
	IconUsers,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import {
	APPLIES_TO_LABELS,
	type DiscountStatus,
	deleteDiscount,
	getDiscountStats,
	listDiscounts,
} from "@/api/discounts";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DiscountModal } from "./DiscountModal";
import {
	formatCurrency,
	formatDiscountDate,
	formatDiscountType,
	formatUsage,
} from "./format";

type DiscountsTab = "all" | "active" | "scheduled" | "expired" | "inactive";

const ITEMS_PER_PAGE = 10;

export function DiscountsPage() {
	usePageTitle("Discounts");
	const navigate = useNavigate();
	const clipboard = useClipboard({ timeout: 1500 });
	const queryClient = useQueryClient();

	const [tab, setTab] = useState<DiscountsTab>("all");
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [page, setPage] = useState(1);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formOpened, setFormOpened] = useState(false);

	const params = {
		search: debouncedSearch || undefined,
		status: tab === "all" ? undefined : (tab as DiscountStatus),
		page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["discounts", params],
		queryFn: () => listDiscounts(params),
	});
	const discounts = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	const statsQuery = useQuery({
		queryKey: ["discounts", "stats"],
		queryFn: getDiscountStats,
	});
	const stats = statsQuery.data;

	const invalidateAfterMutation = () => {
		queryClient.invalidateQueries({ queryKey: ["discounts"] });
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteDiscount(id),
		onSuccess: () => {
			notify.success("Discount deleted");
			invalidateAfterMutation();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	// ----- Handler -----

	const handleTabChange = (val: string | null) => {
		setPage(1);
		setTab((val as DiscountsTab) ?? "all");
	};

	const handleSearchChange = (value: string) => {
		setPage(1);
		setSearch(value);
	};

	const handleAdd = () => setFormOpened(true);
	const handleEdit = (id: string) => setEditingId(id);
	const closeModal = () => {
		setFormOpened(false);
		setEditingId(null);
	};

	const handleCopy = (code: string) => {
		clipboard.copy(code);
		notify.success(`${code} copied to clipboard`, "Code copied");
	};

	const confirmDelete = (id: string, code: string) => {
		modals.openConfirmModal({
			title: "Delete discount",
			children: (
				<Text size="sm">
					Delete <strong>{code}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(id),
		});
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/discounts")}>
					Discounts
				</Anchor>
				<Text size="sm" c="dimmed">
					All Discounts
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Discounts"
				subtitle="Create and manage discount codes"
				actions={
					<Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
						Add Discount
					</Button>
				}
			/>

			{/* Stats Cards — dari GET /discounts/stats. "—" selagi loading/gagal. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconTicket size={20} />}
						label="Active codes"
						value={stats?.totalActiveDiscounts ?? "—"}
						subtitle="Currently running"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconUsers size={20} />}
						label="Total redemptions"
						value={stats?.totalRedemptions ?? "—"}
						subtitle="All-time usage"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Revenue impact"
						value={stats ? formatCurrency(stats.totalRevenueImpact) : "—"}
						subtitle="Last 30 days"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconClockExclamation size={20} />}
						label="Expiring soon"
						value={stats?.totalExpiringSoon ?? "—"}
						subtitle="Within 7 days"
					/>
				</Grid.Col>
			</Grid>

			{/* Section Tabs */}
			<Tabs value={tab} onChange={handleTabChange} mb="md">
				<Tabs.List>
					<Tabs.Tab
						value="all"
						rightSection={
							stats?.statusCounts?.all !== undefined ? (
								<Badge size="sm" variant="light">
									{stats.statusCounts.all}
								</Badge>
							) : undefined
						}
					>
						All
					</Tabs.Tab>
					<Tabs.Tab
						value="active"
						rightSection={
							stats?.statusCounts?.active !== undefined ? (
								<Badge size="sm" variant="light">
									{stats.statusCounts.active}
								</Badge>
							) : undefined
						}
					>
						Active
					</Tabs.Tab>
					<Tabs.Tab
						value="scheduled"
						rightSection={
							stats?.statusCounts?.scheduled !== undefined ? (
								<Badge size="sm" variant="light">
									{stats.statusCounts.scheduled}
								</Badge>
							) : undefined
						}
					>
						Scheduled
					</Tabs.Tab>
					<Tabs.Tab
						value="expired"
						rightSection={
							stats?.statusCounts?.expired !== undefined ? (
								<Badge size="sm" variant="light">
									{stats.statusCounts.expired}
								</Badge>
							) : undefined
						}
					>
						Expired
					</Tabs.Tab>
					<Tabs.Tab
						value="inactive"
						rightSection={
							stats?.statusCounts?.inactive !== undefined ? (
								<Badge size="sm" variant="light">
									{stats.statusCounts.inactive}
								</Badge>
							) : undefined
						}
					>
						Inactive
					</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group>
					<TextInput
						placeholder="Search by code"
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) => handleSearchChange(e.currentTarget.value)}
						w={280}
					/>
				</Group>
			</Card>

			{/* Content Card */}
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
									<Table.Th>Code</Table.Th>
									<Table.Th>Type</Table.Th>
									<Table.Th>Scope</Table.Th>
									<Table.Th>Period</Table.Th>
									<Table.Th>Used</Table.Th>
									<Table.Th>Status</Table.Th>
									<Table.Th style={{ width: 48 }} />
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{discounts.length > 0 ? (
									discounts.map((d) => (
										<Table.Tr
											key={d.id}
											style={{ cursor: "pointer" }}
											onClick={() => handleEdit(d.id)}
										>
											<Table.Td>
												<Text ff="monospace" fw={500}>
													{d.code}
												</Text>
											</Table.Td>
											<Table.Td>
												{formatDiscountType(d.discountType, d.discountValue)}
											</Table.Td>
											<Table.Td>{APPLIES_TO_LABELS[d.appliesToType]}</Table.Td>
											<Table.Td>
												{formatDiscountDate(d.startDate)} →{" "}
												{formatDiscountDate(d.endDate)}
											</Table.Td>
											<Table.Td>{formatUsage(d.used, d.usageLimit)}</Table.Td>
											<Table.Td>
												<StatusBadge status={d.status} />
											</Table.Td>
											<Table.Td>
												<Menu shadow="md" position="bottom-end" withinPortal>
													<Menu.Target>
														<ActionIcon
															variant="subtle"
															color="gray"
															onClick={(e) => e.stopPropagation()}
														>
															<IconDots size={16} />
														</ActionIcon>
													</Menu.Target>
													<Menu.Dropdown onClick={(e) => e.stopPropagation()}>
														<Menu.Item
															leftSection={<IconEdit size={16} />}
															onClick={() => handleEdit(d.id)}
														>
															Edit
														</Menu.Item>
														<Menu.Item
															leftSection={<IconCopy size={16} />}
															onClick={() => handleCopy(d.code)}
														>
															Copy code
														</Menu.Item>
														<Menu.Item
															color="red"
															leftSection={<IconTrash size={16} />}
															onClick={() => confirmDelete(d.id, d.code)}
														>
															Delete
														</Menu.Item>
													</Menu.Dropdown>
												</Menu>
											</Table.Td>
										</Table.Tr>
									))
								) : (
									<Table.Tr>
										<Table.Td colSpan={7}>
											<Center py="xl">
												<Stack align="center" gap="sm">
													<IconTicket
														size={36}
														color="var(--mantine-color-gray-5)"
													/>
													<Text c="dimmed">
														{debouncedSearch || tab !== "all"
															? "No discounts in this tab"
															: "No discounts yet"}
													</Text>
													{!debouncedSearch && tab === "all" && (
														<Button
															variant="light"
															leftSection={<IconPlus size={16} />}
															onClick={handleAdd}
														>
															Add Discount
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

			<DiscountModal
				opened={formOpened || Boolean(editingId)}
				discountId={editingId ?? undefined}
				onClose={closeModal}
				onSuccess={invalidateAfterMutation}
			/>
		</Container>
	);
}
