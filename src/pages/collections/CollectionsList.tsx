import {
	ActionIcon,
	Button,
	Card,
	Center,
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
import { getApiErrorMessage } from "@/api/client";
import {
	type CollectionListParams,
	type CollectionStatus,
	deleteCollection,
	getCollectionStats,
	listCollections,
	patchCollection,
} from "@/api/collections";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Nilai dropdown sort UI → pasangan `sort` + `orderDir` untuk query API. */
const SORT_PARAMS: Record<
	string,
	{ sort: CollectionListParams["sort"]; orderDir: "asc" | "desc" }
> = {
	newest: { sort: "createdAt", orderDir: "desc" },
	oldest: { sort: "createdAt", orderDir: "asc" },
	"name-az": { sort: "name", orderDir: "asc" },
};

function isCollectionStatus(value: string | null): value is CollectionStatus {
	return value === "published" || value === "draft";
}

export function CollectionsList() {
	usePageTitle("Collections");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	// Loop bulk berjalan manual (bukan useMutation) — flag ini untuk disable tombol.
	const [bulkRunning, setBulkRunning] = useState(false);

	// Debounce supaya tidak request ke server tiap keystroke.
	const [debouncedSearch] = useDebouncedValue(search, 300);

	const params: CollectionListParams = {
		search: debouncedSearch || undefined,
		status: isCollectionStatus(statusFilter) ? statusFilter : undefined,
		...(sortBy ? SORT_PARAMS[sortBy] : undefined),
		page,
		limit: 10,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["collections", params],
		queryFn: () => listCollections(params),
	});

	const collections = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// Stats agregat untuk tile (GET /collections/stats).
	// queryKey diawali "collections" supaya ikut ter-refresh saat ada mutasi.
	const statsQuery = useQuery({
		queryKey: ["collections", "stats"],
		queryFn: getCollectionStats,
	});
	const stats = statsQuery.data;

	const invalidateCollections = () =>
		queryClient.invalidateQueries({ queryKey: ["collections"] });

	// Reset page when filters change
	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === collections.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(collections.map((c) => c.id));
		}
	};

	const toggleSelectCollection = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
		);
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteCollection(id),
		onSuccess: () => {
			notify.success("Collection dihapus");
			invalidateCollections();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const confirmDeleteCollection = (collection: {
		id: string;
		name: string;
	}) => {
		modals.openConfirmModal({
			title: "Delete collection",
			children: (
				<Text size="sm">
					Delete <strong>{collection.name}</strong>? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(collection.id),
		});
	};

	/**
	 * Tidak ada endpoint bulk di API — dijalankan sebagai loop request per item,
	 * berurutan, lalu tampilkan ringkasan sukses/gagal.
	 */
	const runBulkAction = async (action: "publish" | "draft" | "delete") => {
		setBulkRunning(true);
		let ok = 0;
		let failed = 0;
		for (const id of selectedIds) {
			try {
				if (action === "delete") {
					await deleteCollection(id);
				} else {
					// PATCH partial: cukup kirim status saja.
					await patchCollection(id, {
						status: action === "publish" ? "published" : "draft",
					});
				}
				ok++;
			} catch {
				failed++;
			}
		}
		setBulkRunning(false);
		setSelectedIds([]);
		invalidateCollections();
		if (failed === 0) {
			notify.success(`${ok} collection berhasil diproses`);
		} else {
			notify.error(`${ok} berhasil, ${failed} gagal diproses`);
		}
	};

	const handleBulkAction = (action: "publish" | "draft" | "delete") => {
		if (action === "delete") {
			modals.openConfirmModal({
				title: "Delete collections",
				children: (
					<Text size="sm">
						Delete <strong>{selectedIds.length}</strong> selected collection(s)?
						This action cannot be undone.
					</Text>
				),
				labels: { confirm: "Delete", cancel: "Cancel" },
				confirmProps: { color: "red" },
				onConfirm: () => void runBulkAction("delete"),
			});
			return;
		}
		void runBulkAction(action);
	};

	const clearSelection = () => setSelectedIds([]);

	return (
		<Container size="xl">
			<PageHeader
				title="Collections"
				subtitle="Edit collections and manage all collections settings"
				actions={
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => navigate("/collections/new")}
					>
						Add Collections
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
								loading={bulkRunning}
								disabled={bulkRunning}
								onClick={() => handleBulkAction("publish")}
							>
								Publish
							</Button>
							<Button
								size="xs"
								variant="default"
								disabled={bulkRunning}
								onClick={() => handleBulkAction("draft")}
							>
								Move to Draft
							</Button>
							<Button
								size="xs"
								color="red"
								variant="light"
								disabled={bulkRunning}
								onClick={() => handleBulkAction("delete")}
							>
								Delete
							</Button>
							<Button
								size="xs"
								variant="subtle"
								disabled={bulkRunning}
								onClick={clearSelection}
							>
								Clear
							</Button>
						</Group>
					</Group>
				</Card>
			)}

			{/* Stats Cards — dari GET /collections/stats. "—" selagi loading/gagal. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Collections"
						value={stats?.totalCollections ?? "—"}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Published"
						value={stats?.published ?? "—"}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconPencil size={20} />}
						label="Draft"
						value={stats?.draft ?? "—"}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconBox size={20} />}
						label="Product in Collections"
						value={stats?.totalProductsInCollections ?? "—"}
					/>
				</Grid.Col>
			</Grid>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					{/* KIRI: search + filter status */}
					<Group>
						<TextInput
							placeholder="Search collections..."
							leftSection={<IconSearch size={16} />}
							value={search}
							onChange={(e) =>
								handleFilterChange(() => setSearch(e.currentTarget.value))
							}
						/>
						<Select
							placeholder="Status"
							data={["published", "draft"]}
							value={statusFilter}
							onChange={(val) => handleFilterChange(() => setStatusFilter(val))}
							clearable
						/>
					</Group>

					{/* KANAN: sort by — hanya opsi yang didukung API. */}
					<Select
						placeholder="Sort by"
						data={[
							{ value: "newest", label: "Newest" },
							{ value: "oldest", label: "Oldest" },
							{ value: "name-az", label: "Name A-Z" },
						]}
						value={sortBy}
						onChange={(val) => handleFilterChange(() => setSortBy(val))}
						clearable
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
					<Table striped>
						<Table.Thead>
							<Table.Tr>
								<Table.Th style={{ width: 40 }}>
									<Checkbox
										checked={
											selectedIds.length === collections.length &&
											collections.length > 0
										}
										indeterminate={
											selectedIds.length > 0 &&
											selectedIds.length < collections.length
										}
										onChange={toggleSelectAll}
									/>
								</Table.Th>
								<Table.Th style={{ width: 50 }}>No</Table.Th>
								<Table.Th>Collection</Table.Th>
								<Table.Th>Products</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Action</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{collections.length > 0 ? (
								collections.map((collection, index) => (
									<Table.Tr
										key={collection.id}
										style={{ cursor: "pointer" }}
										onClick={() =>
											navigate(`/collections/${collection.id}/edit`)
										}
									>
										<Table.Td onClick={(e) => e.stopPropagation()}>
											<Checkbox
												checked={selectedIds.includes(collection.id)}
												onChange={() => toggleSelectCollection(collection.id)}
											/>
										</Table.Td>
										<Table.Td>{(page - 1) * 10 + index + 1}</Table.Td>
										<Table.Td>
											<span style={{ fontWeight: 500 }}>{collection.name}</span>
										</Table.Td>
										<Table.Td>{collection.totalProducts}</Table.Td>
										<Table.Td>
											<StatusBadge status={collection.status} />
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
															navigate(`/collections/${collection.id}/edit`)
														}
													>
														Edit
													</Menu.Item>
													<Menu.Item
														color="red"
														onClick={() => confirmDeleteCollection(collection)}
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
										No collections found
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				)}

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
