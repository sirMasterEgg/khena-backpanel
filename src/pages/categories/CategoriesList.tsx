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
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import {
	IconBox,
	IconDots,
	IconPencil,
	IconPlus,
	IconSearch,
	IconStack2,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { dummyCategories, dummyRoomTypes } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CategoriesList() {
	usePageTitle("Categories");
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [roomTypeFilter, setRoomTypeFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	const stats = useMemo(() => {
		return {
			total: dummyCategories.length,
			published: dummyCategories.filter((c) => c.status === "published").length,
			draft: dummyCategories.filter((c) => c.status === "draft").length,
			totalProducts: dummyCategories.reduce((sum, c) => sum + c.products, 0),
		};
	}, []);

	const filteredCategories = useMemo(() => {
		let result = [...dummyCategories];

		if (statusFilter) {
			result = result.filter((c) => c.status === statusFilter);
		}

		if (roomTypeFilter) {
			result = result.filter((c) => c.roomType === roomTypeFilter);
		}

		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter((c) => c.name.toLowerCase().includes(searchLower));
		}

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
				case "order":
					result.sort((a, b) => a.displayOrder - b.displayOrder);
					break;
			}
		}

		return result;
	}, [search, statusFilter, roomTypeFilter, sortBy]);

	const itemsPerPage = 10;
	const paged = filteredCategories.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);
	const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	const toggleSelectAll = () => {
		if (selectedIds.length === paged.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(paged.map((c) => c.id));
		}
	};

	const toggleSelectCategory = (id: number) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
		);
	};

	const handleBulkAction = (action: "publish" | "draft" | "delete") => {
		console.log(`Bulk "${action}" pada categories:`, selectedIds);
		setSelectedIds([]);
	};

	const clearSelection = () => setSelectedIds([]);

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
						label="Total Categories"
						value={stats.total}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Published"
						value={stats.published}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconPencil size={20} />}
						label="Draft"
						value={stats.draft}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconBox size={20} />}
						label="Total Products"
						value={stats.totalProducts}
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
							data={["published", "draft"]}
							value={statusFilter}
							onChange={(val) => handleFilterChange(() => setStatusFilter(val))}
							clearable
						/>
						{/* FILTER BARU: Room Type */}
						<Select
							placeholder="Room Type"
							data={dummyRoomTypes}
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
						onChange={setSortBy}
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
										selectedIds.length === paged.length && paged.length > 0
									}
									indeterminate={
										selectedIds.length > 0 && selectedIds.length < paged.length
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
						{paged.length > 0 ? (
							paged.map((category, index) => (
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
									<Table.Td>{(page - 1) * itemsPerPage + index + 1}</Table.Td>
									<Table.Td>
										<span style={{ fontWeight: 500 }}>{category.name}</span>
									</Table.Td>
									<Table.Td>
										<Badge variant="outline" color="gray" radius="sm">
											{category.roomType}
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
													onClick={() => console.log(`Delete ${category.id}`)}
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
