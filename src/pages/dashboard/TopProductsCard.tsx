import {
	Avatar,
	Card,
	Group,
	Skeleton,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { Link } from "react-router";
import type { DashboardTopProduct } from "@/api/dashboard";
import { canViewPrices } from "@/config/permissions";
import { formatIDR } from "@/utils/format";

interface TopProductsCardProps {
	products: DashboardTopProduct[];
	isLoading: boolean;
}

export function TopProductsCard({ products, isLoading }: TopProductsCardProps) {
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
				{isLoading ? (
					<Stack gap="xs">
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows, no stable id
							<Skeleton key={i} h={48} radius="sm" />
						))}
					</Stack>
				) : products.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No sales data yet
					</Text>
				) : (
					<Table verticalSpacing="sm" highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Product</Table.Th>
								<Table.Th>Sales</Table.Th>
								{canViewPrices && <Table.Th>Revenue</Table.Th>}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{products.map((product) => (
								<Table.Tr key={product.detailProductId}>
									<Table.Td>
										<Group gap="sm" wrap="nowrap">
											<Avatar
												src={product.imageUrl ?? undefined}
												size={36}
												radius="sm"
											/>
											<Stack gap={0} style={{ minWidth: 0 }}>
												<Text size="sm" fw={500} truncate>
													{product.productName}
												</Text>
												<Text size="xs" c="dimmed">
													{product.colorName}
												</Text>
											</Stack>
										</Group>
									</Table.Td>
									<Table.Td>{product.quantitySold}</Table.Td>
									{canViewPrices && (
										<Table.Td>{formatIDR(product.revenue)}</Table.Td>
									)}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				)}
			</Card.Section>
		</Card>
	);
}
