import {
	Avatar,
	Badge,
	Card,
	Group,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { useNavigate } from "react-router";
import { StatusBadge } from "@/components/StatusBadge";
import type { Product } from "@/data/dummy";

interface ReorderListCardProps {
	products: Product[];
}

/**
 * Kartu kondisional — komponen ini hanya di-render oleh StocksPage bila ada
 * produk di bawah reorder point. Di sini tetap difilter agar mandiri.
 */
export function ReorderListCard({ products }: ReorderListCardProps) {
	const navigate = useNavigate();

	const reorderProducts = products.filter(
		(p) => p.lowStockAlert !== undefined && p.stock <= p.lowStockAlert,
	);

	if (reorderProducts.length === 0) return null;

	return (
		<Card withBorder mb="xl">
			<Group justify="space-between" mb="md">
				<Group gap="xs">
					<Title order={4}>Reorder list</Title>
					<Badge variant="light" color="yellow">
						{reorderProducts.length}
					</Badge>
				</Group>
				<Text size="sm" c="dimmed">
					click a row to open the product
				</Text>
			</Group>

			<Table.ScrollContainer minWidth={600}>
				<Table highlightOnHover verticalSpacing="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Product</Table.Th>
							<Table.Th>In stock</Table.Th>
							<Table.Th>Reorder at</Table.Th>
							<Table.Th>Status</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{reorderProducts.map((product) => (
							<Table.Tr
								key={product.id}
								style={{ cursor: "pointer" }}
								onClick={() => navigate(`/products/${product.id}/edit`)}
							>
								<Table.Td>
									<Group gap="sm" wrap="nowrap">
										<Avatar src={product.image} radius="sm" size={40} />
										<Stack gap={2}>
											<Text size="sm" fw={500}>
												{product.name}
											</Text>
											<Text size="xs" c="dimmed">
												{product.sku}
											</Text>
										</Stack>
									</Group>
								</Table.Td>
								<Table.Td>{product.stock}</Table.Td>
								<Table.Td>{product.lowStockAlert}</Table.Td>
								<Table.Td>
									{product.stock === 0 ? (
										<StatusBadge status="outofstock" />
									) : (
										<StatusBadge status="lowstock" />
									)}
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Card>
	);
}
