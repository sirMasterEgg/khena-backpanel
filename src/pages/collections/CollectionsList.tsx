import {
	ActionIcon,
	Button,
	Card,
	Container,
	Grid,
	Group,
	Menu,
	Pagination,
	Select,
	Table,
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
import { dummyCollections } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CollectionsList() {
	usePageTitle("Collections");
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	const stats = useMemo(() => {
		return {
			total: dummyCollections.length,
			published: dummyCollections.filter((c) => c.status === "published").length,
			draft: dummyCollections.filter((c) => c.status === "draft").length,
			productInCollections: dummyCollections.reduce((sum, c) => sum + c.productCount, 0),
		};
	}, []);

	const filteredCollections = useMemo(() => {
		let result = [...dummyCollections];

		if (statusFilter) {
			result = result.filter((c) => c.status === statusFilter);
		}

		if (search) {
			const searchLower = search.toLowerCase();
			result = result.filter((c) => c.name.toLowerCase().includes(searchLower));
		}

		if (sortBy) {
			switch (sortBy) {
				case "newest":
					result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
					break;
				case "oldest":
					result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
					break;
				case "name-az":
					result.sort((a, b) => a.name.localeCompare(b.name));
					break;
				case "products-high":
					result.sort((a, b) => b.productCount - a.productCount);
					break;
			}
		}

		return result;
	}, [search, statusFilter, sortBy]);

	const itemsPerPage = 10;
	const paged = filteredCollections.slice((page - 1) * itemsPerPage, page * itemsPerPage);
	const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);

	const handleFilterChange = (callback: () => void) => {
		setPage(1);
		callback();
	};

	return (
		<Container size="xl">
			<PageHeader
				title="Collections"
				subtitle="Edit collections and manage all collections settings"
				actions={
					<Button leftSection={<IconPlus size={16} />}>
						Add Collections
					</Button>
				}
			/>

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Collections"
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
						label="Product in Collections"
						value={stats.productInCollections}
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
							onChange={(e) => handleFilterChange(() => setSearch(e.currentTarget.value))}
						/>
						<Select
							placeholder="Status"
							data={["published", "draft"]}
							value={statusFilter}
							onChange={(val) => handleFilterChange(() => setStatusFilter(val))}
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
							{ value: "products-high", label: "Most products" },
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
							<Table.Th style={{ width: 50 }}>No</Table.Th>
							<Table.Th>Collection</Table.Th>
							<Table.Th>Products</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th>Action</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{paged.length > 0 ? (
							paged.map((collection, index) => (
								<Table.Tr
									key={collection.id}
									style={{ cursor: "pointer" }}
									onClick={() => navigate(`/collections/${collection.id}`)}
								>
									<Table.Td>{(page - 1) * itemsPerPage + index + 1}</Table.Td>
									<Table.Td>
										<span style={{ fontWeight: 500 }}>{collection.name}</span>
									</Table.Td>
									<Table.Td>{collection.productCount}</Table.Td>
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
												<Menu.Item onClick={() => navigate(`/collections/${collection.id}/edit`)}>
													Edit
												</Menu.Item>
												<Menu.Item onClick={() => console.log(`Duplicate ${collection.id}`)}>
													Duplicate
												</Menu.Item>
												<Menu.Item color="red" onClick={() => console.log(`Delete ${collection.id}`)}>
													Delete
												</Menu.Item>
											</Menu.Dropdown>
										</Menu>
									</Table.Td>
								</Table.Tr>
							))
						) : (
							<Table.Tr>
								<Table.Td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
									No collections found
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