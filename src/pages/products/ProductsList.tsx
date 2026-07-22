import {
	ActionIcon,
	Badge,
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
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconAlertTriangle,
	IconDots,
	IconDownload,
	IconPencil,
	IconPlus,
	IconSearch,
	IconStack2,
	IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { listCategories } from "@/api/categories";
import { getApiErrorMessage } from "@/api/client";
import {
	deleteProduct,
	listProducts,
	type ProductListParams,
	type ProductStatus,
	patchProduct,
} from "@/api/products";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Nilai dropdown sort UI → pasangan `sort` + `order` untuk query API. */
const SORT_PARAMS: Record<
	string,
	{ sort: ProductListParams["sort"]; order: "asc" | "desc" }
> = {
	newest: { sort: "createdAt", order: "desc" },
	oldest: { sort: "createdAt", order: "asc" },
	"name-az": { sort: "name", order: "asc" },
};

const PRODUCT_STATUSES: ProductStatus[] = [
	"published",
	"draft",
	"scheduled",
	"archived",
];

function isProductStatus(value: string | null): value is ProductStatus {
	return PRODUCT_STATUSES.includes(value as ProductStatus);
}

export function ProductsList() {
	usePageTitle("Products");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [activeTab, setActiveTab] = useState<string | null>("all");
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	// Loop bulk berjalan manual (bukan useMutation) — flag ini untuk disable tombol.
	const [bulkRunning, setBulkRunning] = useState(false);

	// Debounce supaya tidak request ke server tiap keystroke.
	const [debouncedSearch] = useDebouncedValue(search, 300);

	// Filter status mengikuti tab aktif.
	const effectiveStatus = activeTab !== "all" ? activeTab : null;

	const params: ProductListParams = {
		search: debouncedSearch || undefined,
		categoryId: categoryFilter ?? undefined,
		status: isProductStatus(effectiveStatus) ? effectiveStatus : undefined,
		...(sortBy ? SORT_PARAMS[sortBy] : undefined),
		page,
		limit: 10,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["products", params],
		queryFn: () => listProducts(params),
	});

	const products = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// Opsi kategori dari API — bukan lagi derive dari data produk.
	const categoriesQuery = useQuery({
		queryKey: ["categories", { forFilter: true }],
		// limit besar: dropdown butuh semua kategori, bukan 10 pertama.
		queryFn: () => listCategories({ limit: 100 }),
	});
	const categoryOptions = (categoriesQuery.data?.data ?? []).map((c) => ({
		value: c.id,
		label: c.category,
	}));

	const invalidateProducts = () =>
		queryClient.invalidateQueries({ queryKey: ["products"] });

	// Reset page when filters change
	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	// Checkbox handlers
	const toggleSelectAll = () => {
		if (selectedIds.length === products.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(products.map((p) => p.id));
		}
	};

	const toggleSelectProduct = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
		);
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteProduct(id),
		onSuccess: () => {
			notify.success("Product dihapus");
			invalidateProducts();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const confirmDeleteProduct = (product: { id: string; name: string }) => {
		modals.openConfirmModal({
			title: "Delete product",
			children: (
				<Text size="sm">
					Delete <strong>{product.name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(product.id),
		});
	};

	/**
	 * Tidak ada endpoint bulk di API — dijalankan sebagai loop request per item,
	 * berurutan, lalu tampilkan ringkasan sukses/gagal.
	 */
	const runBulkAction = async (
		action: "publish" | "draft" | "archive" | "delete",
	) => {
		setBulkRunning(true);
		let ok = 0;
		let failed = 0;
		for (const id of selectedIds) {
			try {
				if (action === "delete") {
					await deleteProduct(id);
				} else {
					const status: ProductStatus =
						action === "publish"
							? "published"
							: action === "archive"
								? "archived"
								: "draft";
					// PATCH partial: cukup kirim status saja.
					await patchProduct(id, { status });
				}
				ok++;
			} catch {
				failed++;
			}
		}
		setBulkRunning(false);
		setSelectedIds([]);
		invalidateProducts();
		if (failed === 0) {
			notify.success(`${ok} product berhasil diproses`);
		} else {
			notify.error(`${ok} berhasil, ${failed} gagal diproses`);
		}
	};

	const handleBulkAction = (
		action: "publish" | "draft" | "archive" | "delete",
	) => {
		if (action === "delete") {
			modals.openConfirmModal({
				title: "Delete products",
				children: (
					<Text size="sm">
						Delete <strong>{selectedIds.length}</strong> selected product(s)?
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

	// Helper to format last updated
	const formatLastUpdated = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const daysAgo = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (daysAgo === 0) return "Today";
		if (daysAgo === 1) return "1 day ago";
		return `${daysAgo} days ago`;
	};

	return (
		<Container size="xl">
			<PageHeader
				title="Products"
				subtitle="Edit product details and manage all product settings"
				actions={
					<Group gap="sm">
						<Button variant="default" leftSection={<IconUpload size={16} />}>
							Import
						</Button>
						<Button variant="default" leftSection={<IconDownload size={16} />}>
							Export
						</Button>
						<Button
							leftSection={<IconPlus size={16} />}
							onClick={() => navigate("/products/new")}
						>
							Add New Product
						</Button>
					</Group>
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
								variant="default"
								disabled={bulkRunning}
								onClick={() => handleBulkAction("archive")}
							>
								Archive
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

			{/* Stats Cards — hanya Total Products yang tersedia dari API (meta.total).
			    Tidak ada endpoint stats produk: tile lain diisi placeholder. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Products"
						value={data?.meta.total ?? "—"}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Inventory"
						value="—"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconAlertTriangle size={20} />}
						label="Out of stocks"
						value="—"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconPencil size={20} />}
						label="Draft Products"
						value="—"
					/>
				</Grid.Col>
			</Grid>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Stack gap="md">
					{/* Tabs — angka per-status butuh endpoint stats produk (belum ada),
					    jadi label tampil tanpa angka untuk sementara. */}
					<Tabs
						value={activeTab}
						onChange={(tab) => handleFilterChange(() => setActiveTab(tab))}
					>
						<Tabs.List>
							<Tabs.Tab value="all">All Products</Tabs.Tab>
							<Tabs.Tab value="published">Published</Tabs.Tab>
							<Tabs.Tab value="draft">Draft</Tabs.Tab>
							<Tabs.Tab value="scheduled">Scheduled</Tabs.Tab>
							<Tabs.Tab value="archived">Archived</Tabs.Tab>
						</Tabs.List>
					</Tabs>

					{/* Filters — Search + Category di kiri, Sort terpisah di kanan. */}
					<Group justify="space-between">
						<Group grow style={{ flex: 1 }} maw={600}>
							<TextInput
								placeholder="Search products..."
								leftSection={<IconSearch size={16} />}
								value={search}
								onChange={(e) =>
									handleFilterChange(() => setSearch(e.currentTarget.value))
								}
							/>
							<Select
								placeholder="Category"
								data={categoryOptions}
								value={categoryFilter}
								onChange={(val) =>
									handleFilterChange(() => setCategoryFilter(val))
								}
								clearable
								searchable
							/>
						</Group>
						<Select
							placeholder="Sort"
							data={[
								{ value: "newest", label: "Newest" },
								{ value: "oldest", label: "Oldest" },
								{ value: "name-az", label: "Name A-Z" },
								// API tidak mendukung sort harga — opsi tetap ada tapi disabled.
								{ value: "price-low", label: "Price low→high", disabled: true },
								{
									value: "price-high",
									label: "Price high→low",
									disabled: true,
								},
							]}
							value={sortBy}
							onChange={(val) => handleFilterChange(() => setSortBy(val))}
							clearable
						/>
					</Group>
				</Stack>
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
											selectedIds.length === products.length &&
											products.length > 0
										}
										onChange={toggleSelectAll}
										indeterminate={
											selectedIds.length > 0 &&
											selectedIds.length < products.length
										}
									/>
								</Table.Th>
								<Table.Th>Product</Table.Th>
								<Table.Th>Collection</Table.Th>
								<Table.Th>Category</Table.Th>
								<Table.Th>Price</Table.Th>
								<Table.Th>Margin</Table.Th>
								<Table.Th>Stock</Table.Th>
								<Table.Th>Last Updated</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Action</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{products.length > 0 ? (
								products.map((product) => (
									<Table.Tr
										key={product.id}
										style={{ cursor: "pointer" }}
										onClick={() => navigate(`/products/${product.id}/edit`)}
									>
										<Table.Td onClick={(e) => e.stopPropagation()}>
											<Checkbox
												checked={selectedIds.includes(product.id)}
												onChange={() => toggleSelectProduct(product.id)}
												onClick={(e) => e.stopPropagation()}
											/>
										</Table.Td>
										<Table.Td>
											<Stack gap={0}>
												<span style={{ fontWeight: 500 }}>{product.name}</span>
												<span style={{ fontSize: "12px", color: "gray" }}>
													SKU: {product.baseSku}
												</span>
											</Stack>
										</Table.Td>
										{/* Collection/Price/Margin/Stock tidak tersedia di
										    endpoint list → placeholder. */}
										<Table.Td>—</Table.Td>
										<Table.Td>{product.category.name}</Table.Td>
										<Table.Td>—</Table.Td>
										<Table.Td>—</Table.Td>
										<Table.Td>
											<Badge color="gray" variant="light">
												—
											</Badge>
										</Table.Td>
										<Table.Td>{formatLastUpdated(product.updatedAt)}</Table.Td>
										<Table.Td>
											{product.status ? (
												<StatusBadge status={product.status} />
											) : (
												"—"
											)}
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
															navigate(`/products/${product.id}/edit`)
														}
													>
														Edit
													</Menu.Item>
													{/* Tidak ada endpoint duplicate produk. */}
													<Menu.Item disabled>Duplicate</Menu.Item>
													<Menu.Item
														color="red"
														onClick={() => confirmDeleteProduct(product)}
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
										colSpan={10}
										style={{ textAlign: "center", padding: "2rem" }}
									>
										No products found
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
