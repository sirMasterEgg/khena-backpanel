import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Checkbox,
	Container,
	Grid,
	Group,
	Menu,
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
	IconDots,
	IconDownload,
	IconPencil,
	IconPlus,
	IconSearch,
	IconStack2,
	IconUpload,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { dummyProducts } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ProductsList() {
	usePageTitle("Products");
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<string | null>("all");
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	// Calculate stats from full data
	const stats = useMemo(() => {
		return {
			total: dummyProducts.length,
			inventory: dummyProducts.reduce((sum, p) => sum + p.stock, 0),
			outOfStock: dummyProducts.filter((p) => p.stock === 0).length,
			draft: dummyProducts.filter((p) => p.status === "draft").length,
			published: dummyProducts.filter((p) => p.status === "published").length,
			scheduled: dummyProducts.filter((p) => p.status === "scheduled").length,
			archived: dummyProducts.filter((p) => p.status === "archived").length,
		};
	}, []);

	// Filter & sort logic
	const filteredProducts = useMemo(() => {
		let result = [...dummyProducts];

		// Tab filter
		if (activeTab && activeTab !== "all") {
			result = result.filter((p) => p.status === activeTab);
		}

		// Status select filter
		if (statusFilter) {
			result = result.filter((p) => p.status === statusFilter);
		}

		// Category filter
		if (categoryFilter) {
			result = result.filter((p) => p.category === categoryFilter);
		}

		// Search by name or SKU
		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter(
				(p) =>
					p.name.toLowerCase().includes(searchLower) ||
					p.sku.toLowerCase().includes(searchLower),
			);
		}

		// Sort
		if (sortBy) {
			switch (sortBy) {
				case "newest":
					result.sort(
						(a, b) =>
							new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
					);
					break;
				case "oldest":
					result.sort(
						(a, b) =>
							new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
					);
					break;
				case "name-az":
					result.sort((a, b) => a.name.localeCompare(b.name));
					break;
				case "price-low":
					result.sort((a, b) => a.price - b.price);
					break;
				case "price-high":
					result.sort((a, b) => b.price - a.price);
					break;
			}
		}

		return result;
	}, [activeTab, search, categoryFilter, statusFilter, sortBy]);

	// Pagination
	const itemsPerPage = 10;
	const paged = filteredProducts.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);
	const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

	// Reset page when filters change
	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	// Get unique categories from data
	const categories = Array.from(new Set(dummyProducts.map((p) => p.category)));

	// Checkbox handlers
	const toggleSelectAll = () => {
		if (selectedIds.length === paged.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(paged.map((p) => p.id));
		}
	};

	const toggleSelectProduct = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
		);
	};

	const handleBulkAction = (
		action: "publish" | "draft" | "archive" | "delete",
	) => {
		console.log(`Bulk "${action}" pada produk:`, selectedIds);
		setSelectedIds([]);
	};

	const clearSelection = () => setSelectedIds([]);

	// Helper to calculate margin
	const calculateMargin = (price: number, cost: number) => {
		return Math.round(((price - cost) / price) * 100);
	};

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
								onClick={() => handleBulkAction("publish")}
							>
								Publish
							</Button>
							<Button
								size="xs"
								variant="default"
								onClick={() => handleBulkAction("draft")}
							>
								Move to Draft
							</Button>
							<Button
								size="xs"
								variant="default"
								onClick={() => handleBulkAction("archive")}
							>
								Archive
							</Button>
							<Button
								size="xs"
								color="red"
								variant="light"
								onClick={() => handleBulkAction("delete")}
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
						label="Total Products"
						value={stats.total}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Inventory"
						value={stats.inventory}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconAlertTriangle size={20} />}
						label="Out of stocks"
						value={stats.outOfStock}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconPencil size={20} />}
						label="Draft Products"
						value={stats.draft}
					/>
				</Grid.Col>
			</Grid>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Stack gap="md">
					{/* Tabs */}
					<Tabs value={activeTab} onChange={setActiveTab}>
						<Tabs.List>
							<Tabs.Tab value="all">All Products ({stats.total})</Tabs.Tab>
							<Tabs.Tab value="published">
								Published ({stats.published})
							</Tabs.Tab>
							<Tabs.Tab value="draft">Draft ({stats.draft})</Tabs.Tab>
							<Tabs.Tab value="scheduled">
								Scheduled ({stats.scheduled})
							</Tabs.Tab>
							<Tabs.Tab value="archived">Archived ({stats.archived})</Tabs.Tab>
						</Tabs.List>
					</Tabs>

					{/* Filters */}
					<Group grow>
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
							data={categories}
							value={categoryFilter}
							onChange={(val) =>
								handleFilterChange(() => setCategoryFilter(val))
							}
							clearable
						/>
						<Select
							placeholder="Status"
							data={["published", "draft", "scheduled", "archived"]}
							value={statusFilter}
							onChange={(val) => handleFilterChange(() => setStatusFilter(val))}
							clearable
						/>
						<Select
							placeholder="Sort"
							data={[
								{ value: "newest", label: "Newest" },
								{ value: "oldest", label: "Oldest" },
								{ value: "name-az", label: "Name A-Z" },
								{ value: "price-low", label: "Price low→high" },
								{ value: "price-high", label: "Price high→low" },
							]}
							value={sortBy}
							onChange={setSortBy}
							clearable
						/>
					</Group>
				</Stack>
			</Card>

			{/* Table */}
			<Card withBorder>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: 40 }}>
								<Checkbox
									checked={
										selectedIds.length === paged.length && paged.length > 0
									}
									onChange={toggleSelectAll}
									indeterminate={
										selectedIds.length > 0 && selectedIds.length < paged.length
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
						{paged.length > 0 ? (
							paged.map((product) => (
								<Table.Tr
									key={product.id}
									style={{ cursor: "pointer" }}
									onClick={() => navigate(`/products/${product.id}`)}
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
												SKU: {product.sku}
											</span>
										</Stack>
									</Table.Td>
									<Table.Td>{product.collection}</Table.Td>
									<Table.Td>{product.category}</Table.Td>
									<Table.Td>${product.price}</Table.Td>
									<Table.Td>
										{calculateMargin(product.price, product.cost)}%
									</Table.Td>
									<Table.Td>
										<Badge
											color={
												product.stock === 0
													? "red"
													: product.stock < 5
														? "yellow"
														: "green"
											}
										>
											{product.stock} units
										</Badge>
									</Table.Td>
									<Table.Td>{formatLastUpdated(product.updatedAt)}</Table.Td>
									<Table.Td>
										<StatusBadge
											status={
												product.status as
													| "published"
													| "draft"
													| "scheduled"
													| "archived"
											}
										/>
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
												<Menu.Item
													onClick={() => console.log(`Duplicate ${product.id}`)}
												>
													Duplicate
												</Menu.Item>
												<Menu.Item
													color="red"
													onClick={() => console.log(`Delete ${product.id}`)}
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
