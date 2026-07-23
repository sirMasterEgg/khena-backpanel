import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Checkbox,
	Container,
	Grid,
	Group,
	Loader,
	Menu,
	Pagination,
	Select,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconBox,
	IconDots,
	IconPencil,
	IconPlus,
	IconSearch,
	IconStack2,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
	type Category,
	type CategorySortField,
	type CategoryStatus,
	deleteCategory,
	getCategoryStats,
	listCategories,
	updateCategory,
} from "@/api/categories";
import { getApiErrorMessage } from "@/api/client";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS } from "@/data/constants.ts";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useRoomTypeOptions } from "@/hooks/useRoomTypeOptions";

const ITEMS_PER_PAGE = 10;
/** Jeda sebelum ketikan di kolom search dikirim ke server. */
const SEARCH_DEBOUNCE_MS = 400;

/** Opsi sort di UI tidak sama dgn kolom sort API — petakan dulu. */
function mapSortToApi(sortBy: string | null): CategorySortField {
	switch (sortBy) {
		case "name-az":
			return "name";
		case "order":
			return "displayOrder";
		default:
			return "createdAt";
	}
}

function mapOrderDirToApi(sortBy: string | null): "asc" | "desc" {
	switch (sortBy) {
		case "oldest":
		case "name-az":
		case "order":
			return "asc";
		default:
			return "desc";
	}
}

/** Ringkasan hasil operasi bulk (loop per-id, sebagian bisa gagal). */
function notifyBulkResult(
	results: PromiseSettledResult<unknown>[],
	successVerb: string,
) {
	const failed = results.filter((r) => r.status === "rejected").length;
	const succeeded = results.length - failed;

	if (failed === 0) {
		notify.success(`${succeeded} category ${successVerb}`);
	} else if (succeeded === 0) {
		notify.error(`Gagal ${successVerb} ${failed} category`);
	} else {
		notify.info(`${succeeded} ${successVerb}, ${failed} gagal`);
	}
}

export function CategoriesList() {
	usePageTitle("Categories");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// `search` = nilai input (langsung, biar ketikan responsif),
	// `debouncedSearch` = yang dikirim ke server.
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [roomTypeFilter, setRoomTypeFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const { options: roomTypeOptions, nameById: roomTypeNameById } =
		useRoomTypeOptions();

	const { data, isLoading, isError, error } = useQuery({
		queryKey: [
			"categories",
			{ search: debouncedSearch, statusFilter, roomTypeFilter, sortBy, page },
		],
		queryFn: () =>
			listCategories({
				search: debouncedSearch || undefined,
				status: (statusFilter as CategoryStatus | null) || undefined,
				roomTypeId: roomTypeFilter || undefined,
				sort: mapSortToApi(sortBy),
				orderDir: mapOrderDirToApi(sortBy),
				page,
				limit: ITEMS_PER_PAGE,
			}),
		placeholderData: (prev) => prev,
	});

	const categories = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// Kartu statistik selalu angka keseluruhan — jangan hitung dari halaman aktif.
	const { data: stats } = useQuery({
		queryKey: ["categories", "stats"],
		queryFn: getCategoryStats,
	});

	const clearSelection = () => setSelectedIds([]);

	const invalidateCategories = () =>
		queryClient.invalidateQueries({ queryKey: ["categories"] });

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteCategory(id),
		onSuccess: () => {
			notify.success("Category dihapus");
			invalidateCategories();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	// Tidak ada endpoint bulk di contract → loop per-id, invalidate sekali di akhir.
	const bulkDeleteMutation = useMutation({
		mutationFn: (ids: string[]) =>
			Promise.allSettled(ids.map((id) => deleteCategory(id))),
		onSuccess: (results) => {
			notifyBulkResult(results, "dihapus");
			invalidateCategories();
			clearSelection();
		},
	});

	const bulkStatusMutation = useMutation({
		mutationFn: ({
			items,
			status,
		}: {
			items: Category[];
			status: CategoryStatus;
		}) =>
			// PUT butuh body LENGKAP — bukan PATCH, field yang hilang ditolak 422.
			Promise.allSettled(
				items.map((c) =>
					updateCategory(c.id, {
						category: c.category,
						order: c.order,
						roomTypeId: c.roomTypeId,
						status,
					}),
				),
			),
		onSuccess: (results, { status }) => {
			notifyBulkResult(
				results,
				status === "published" ? "dipublish" : "dijadikan draft",
			);
			invalidateCategories();
			clearSelection();
		},
	});

	const isBulkPending =
		bulkDeleteMutation.isPending || bulkStatusMutation.isPending;

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === categories.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(categories.map((c) => c.id));
		}
	};

	const toggleSelectCategory = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
		);
	};

	const confirmDelete = (id: string, name: string) => {
		modals.openConfirmModal({
			title: "Delete category",
			children: (
				<Text size="sm">
					Delete <strong>{name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(id),
		});
	};

	const confirmBulkDelete = () => {
		modals.openConfirmModal({
			title: "Delete categories",
			children: (
				<Text size="sm">
					Delete <strong>{selectedIds.length}</strong> selected categor
					{selectedIds.length === 1 ? "y" : "ies"}? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => bulkDeleteMutation.mutate(selectedIds),
		});
	};

	const handleBulkStatus = (status: CategoryStatus) => {
		// Objek existing sudah di tangan dari hasil list — jangan fetch ulang per-id.
		const items = categories.filter((c) => selectedIds.includes(c.id));
		bulkStatusMutation.mutate({ items, status });
	};

	return (
		<Container size="xl">
			<PageHeader
				title="Categories"
				subtitle="Manage product categories and how they appear in the SHOP menu"
				actions={
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => navigate("/categories/new")}
					>
						Add Category
					</Button>
				}
			/>

			{/* Bulk Actions Toolbar */}
			{selectedIds.length > 0 && (
				<Card withBorder mb="md">
					<Group justify="space-between">
						<Text fw={500} size="sm">
							{selectedIds.length} selected
						</Text>
						<Group gap="sm">
							<Button
								size="xs"
								variant="default"
								disabled={isBulkPending}
								loading={bulkStatusMutation.isPending}
								onClick={() => handleBulkStatus("published")}
							>
								Publish
							</Button>
							<Button
								size="xs"
								variant="default"
								disabled={isBulkPending}
								onClick={() => handleBulkStatus("draft")}
							>
								Move to Draft
							</Button>
							<Button
								size="xs"
								color="red"
								variant="light"
								disabled={isBulkPending}
								loading={bulkDeleteMutation.isPending}
								onClick={confirmBulkDelete}
							>
								Delete
							</Button>
							<Button size="xs" variant="subtle" onClick={clearSelection}>
								Clear
							</Button>
						</Group>
					</Group>
				</Card>
			)}

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Categories"
						value={stats?.totalCategories ?? 0}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Published"
						value={stats?.publishedCategories ?? 0}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconPencil size={20} />}
						label="Draft"
						value={stats?.draftCategories ?? 0}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconBox size={20} />}
						label="Room Groups"
						value={stats?.roomGroups ?? 0}
					/>
				</Grid.Col>
			</Grid>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					{/* KIRI: search + filter status + filter room type */}
					<Group>
						<TextInput
							placeholder="Search categories..."
							leftSection={<IconSearch size={16} />}
							value={search}
							onChange={(e) =>
								handleFilterChange(() => setSearch(e.currentTarget.value))
							}
						/>
						<Select
							placeholder="Status"
							data={STATUS}
							value={statusFilter}
							onChange={(val) => handleFilterChange(() => setStatusFilter(val))}
							clearable
						/>
						{/* FILTER BARU: Room Type */}
						<Select
							placeholder="Room Type"
							data={roomTypeOptions}
							value={roomTypeFilter}
							onChange={(val) =>
								handleFilterChange(() => setRoomTypeFilter(val))
							}
							clearable
						/>
					</Group>

					{/* KANAN: sort by */}
					<Select
						placeholder="Sort by"
						data={[
							{ value: "newest", label: "Newest" },
							{ value: "oldest", label: "Oldest" },
							{ value: "name-az", label: "Name A-Z" },
							{ value: "order", label: "Display order" },
						]}
						value={sortBy}
						onChange={(val) => handleFilterChange(() => setSortBy(val))}
						clearable
					/>
				</Group>
			</Card>

			{/* Table */}
			<Card withBorder>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: 40 }}>
								<Checkbox
									checked={
										selectedIds.length === categories.length &&
										categories.length > 0
									}
									indeterminate={
										selectedIds.length > 0 &&
										selectedIds.length < categories.length
									}
									onChange={toggleSelectAll}
								/>
							</Table.Th>
							<Table.Th style={{ width: 50 }}>No</Table.Th>
							<Table.Th>Category</Table.Th>
							<Table.Th>Room Type</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th>Action</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{isLoading ? (
							<Table.Tr>
								<Table.Td colSpan={6} style={{ padding: "2rem" }}>
									<Group justify="center">
										<Loader size="sm" />
									</Group>
								</Table.Td>
							</Table.Tr>
						) : isError ? (
							<Table.Tr>
								<Table.Td
									colSpan={6}
									style={{ textAlign: "center", padding: "2rem" }}
								>
									<Text c="red" size="sm">
										{getApiErrorMessage(error)}
									</Text>
								</Table.Td>
							</Table.Tr>
						) : categories.length > 0 ? (
							categories.map((category, index) => (
								<Table.Tr
									key={category.id}
									style={{ cursor: "pointer" }}
									onClick={() => navigate(`/categories/${category.id}/edit`)}
								>
									<Table.Td onClick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.includes(category.id)}
											onChange={() => toggleSelectCategory(category.id)}
										/>
									</Table.Td>
									<Table.Td>{(page - 1) * ITEMS_PER_PAGE + index + 1}</Table.Td>
									<Table.Td>
										<span style={{ fontWeight: 500 }}>{category.category}</span>
									</Table.Td>
									<Table.Td>
										<Badge variant="outline" color="gray" radius="sm">
											{roomTypeNameById.get(category.roomTypeId) ?? "—"}
										</Badge>
									</Table.Td>
									<Table.Td>
										<StatusBadge status={category.status} />
									</Table.Td>
									<Table.Td onClick={(e) => e.stopPropagation()}>
										<Menu>
											<Menu.Target>
												<ActionIcon size="sm" variant="subtle">
													<IconDots size={14} />
												</ActionIcon>
											</Menu.Target>
											<Menu.Dropdown>
												<Menu.Item
													onClick={() =>
														navigate(`/categories/${category.id}/edit`)
													}
												>
													Edit
												</Menu.Item>
												<Menu.Item
													color="red"
													onClick={() =>
														confirmDelete(category.id, category.category)
													}
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
								<Table.Td
									colSpan={6}
									style={{ textAlign: "center", padding: "2rem" }}
								>
									No categories found
								</Table.Td>
							</Table.Tr>
						)}
					</Table.Tbody>
				</Table>

				{/* Pagination */}
				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination value={page} onChange={setPage} total={totalPages} />
					</Group>
				)}
			</Card>
		</Container>
	);
}
