import {
	ActionIcon,
	Avatar,
	Badge,
	Button,
	Card,
	Container,
	Group,
	Menu,
	Pagination,
	Select,
	Stack,
	Table,
	Tabs,
	TextInput,
} from "@mantine/core";
import { IconDots, IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { dummyProducts } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ProductsList() {
	usePageTitle("Products");
	const navigate = useNavigate();
	const [page, setPage] = useState(1);

	const productStats = {
		all: dummyProducts.length,
		published: dummyProducts.filter((p) => p.status === "published").length,
		draft: dummyProducts.filter((p) => p.status === "draft").length,
		scheduled: dummyProducts.filter((p) => p.status === "scheduled").length,
		archived: 0,
	};

	return (
		<Container size="xl">
			<PageHeader
				title="Products"
				actions={
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => navigate("/products/new")}
					>
						Add Product
					</Button>
				}
			/>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Stack gap="md">
					{/* Tabs */}
					<Tabs defaultValue="all">
						<Tabs.List>
							<Tabs.Tab value="all">All ({productStats.all})</Tabs.Tab>
							<Tabs.Tab value="published">
								Published ({productStats.published})
							</Tabs.Tab>
							<Tabs.Tab value="draft">Draft ({productStats.draft})</Tabs.Tab>
							<Tabs.Tab value="scheduled">
								Scheduled ({productStats.scheduled})
							</Tabs.Tab>
							<Tabs.Tab value="archived">
								Archived ({productStats.archived})
							</Tabs.Tab>
						</Tabs.List>
					</Tabs>

					{/* Filters */}
					<Group grow>
						<TextInput
							placeholder="Search products..."
							leftSection={<IconSearch size={16} />}
						/>
						<Select
							placeholder="Category"
							data={["Seating", "Tables", "Storage", "Lighting"]}
						/>
						<Select
							placeholder="Status"
							data={["Published", "Draft", "Archived"]}
						/>
						<Select
							placeholder="Sort"
							data={["Newest", "Oldest", "Name A-Z"]}
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
								<input type="checkbox" />
							</Table.Th>
							<Table.Th>Product</Table.Th>
							<Table.Th>Category</Table.Th>
							<Table.Th>Price</Table.Th>
							<Table.Th>Stock</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th>Last Updated</Table.Th>
							<Table.Th>Action</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{dummyProducts.map((product) => (
							<Table.Tr key={product.id}>
								<Table.Td>
									<input type="checkbox" />
								</Table.Td>
								<Table.Td>
									<Group gap="sm">
										<Avatar size="md" src={product.image} />
										<Stack gap={0}>
											<Group gap="xs">
												<span style={{ fontWeight: 500 }}>{product.name}</span>
											</Group>
											<span style={{ fontSize: "12px", color: "gray" }}>
												SKU: {product.sku}
											</span>
										</Stack>
									</Group>
								</Table.Td>
								<Table.Td>{product.category}</Table.Td>
								<Table.Td>${product.price}</Table.Td>
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
								<Table.Td>2 days ago</Table.Td>
								<Table.Td>
									<Menu>
										<Menu.Target>
											<ActionIcon size="sm" variant="subtle">
												<IconDots size={14} />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>
											<Menu.Item
												onClick={() => navigate(`/products/${product.id}/edit`)}
											>
												Edit
											</Menu.Item>
											<Menu.Item>View</Menu.Item>
											<Menu.Item color="red">Delete</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>

				{/* Pagination */}
				<Group justify="center" mt="md">
					<Pagination
						value={page}
						onChange={setPage}
						total={Math.ceil(dummyProducts.length / 10)}
					/>
				</Group>
			</Card>
		</Container>
	);
}
