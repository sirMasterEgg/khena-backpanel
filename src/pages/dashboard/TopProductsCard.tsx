import { Avatar, Card, Group, Stack, Table, Text } from "@mantine/core";
import { Link, useNavigate } from "react-router";
import { canViewPrices } from "@/config/permissions";
import { formatIDR } from "@/utils/format";
import { getTopProducts } from "./dashboardData";

const topProducts = getTopProducts();

export function TopProductsCard() {
	const navigate = useNavigate();

	return (
		<Card withBorder h="100%">
			<Card.Section inheritPadding py="md">
				<Group justify="space-between">
					<Text fw={600}>Top Products</Text>
					<Text component={Link} to="/products" c="blue" size="sm" fw={500}>
						View All
					</Text>
				</Group>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
				{topProducts.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No sales data yet
					</Text>
				) : (
					<Table verticalSpacing="sm" highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Product</Table.Th>
								{canViewPrices && <Table.Th>Price</Table.Th>}
								<Table.Th>Sales</Table.Th>
								{canViewPrices && <Table.Th>Revenue</Table.Th>}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{topProducts.map(({ product, sales, revenue }) => (
								<Table.Tr
									key={product.id}
									onClick={() => navigate(`/products/${product.id}/edit`)}
									style={{ cursor: "pointer" }}
								>
									<Table.Td>
										<Group gap="sm" wrap="nowrap">
											<Avatar src={product.image} size={36} radius="sm" />
											<Stack gap={0} style={{ minWidth: 0 }}>
												<Text size="sm" fw={500} truncate>
													{product.name}
												</Text>
												<Text size="xs" c="dimmed">
													{product.category}
												</Text>
											</Stack>
										</Group>
									</Table.Td>
									{canViewPrices && (
										<Table.Td>{formatIDR(product.price)}</Table.Td>
									)}
									<Table.Td>{sales}</Table.Td>
									{canViewPrices && <Table.Td>{formatIDR(revenue)}</Table.Td>}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				)}
			</Card.Section>
		</Card>
	);
}
