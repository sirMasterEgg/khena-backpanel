import { Card, Group, Image, Indicator, Stack, Text } from "@mantine/core";
import type { Product } from "@/data/dummy";
import { formatCurrency } from "./format";

interface ProductCardProps {
	product: Product;
	/** Berapa banyak produk ini sudah ada di keranjang (untuk badge). */
	qtyInCart: number;
	/** Dipanggil saat kartu diklik (kecuali stok habis). */
	onAdd: () => void;
}

/** Kartu produk di katalog POS. Klik → tambah ke keranjang. */
export function ProductCard({ product, qtyInCart, onAdd }: ProductCardProps) {
	const outOfStock = product.stock === 0;
	const lowStock =
		product.lowStockAlert != null && product.stock <= product.lowStockAlert;

	return (
		<Card
			withBorder
			padding="sm"
			onClick={outOfStock ? undefined : onAdd}
			style={{
				cursor: outOfStock ? "not-allowed" : "pointer",
				opacity: outOfStock ? 0.5 : 1,
			}}
		>
			<Card.Section>
				<Indicator
					label={qtyInCart}
					size={22}
					color="blue"
					disabled={qtyInCart === 0}
					offset={16}
				>
					<Image
						src={product.image}
						alt={product.name}
						height={120}
						fit="cover"
					/>
				</Indicator>
			</Card.Section>

			<Stack gap={2} mt="sm">
				<Text fw={500} lineClamp={1}>
					{product.name}
				</Text>
				<Text size="xs" c="dimmed">
					{product.sku}
				</Text>
				<Group justify="space-between" mt={4} wrap="nowrap">
					<Text fw={600}>{formatCurrency(product.price)}</Text>
					{outOfStock ? (
						<Text size="xs" c="red" fw={500}>
							Out of stock
						</Text>
					) : lowStock ? (
						<Text size="xs" c="orange" fw={500}>
							Low: {product.stock}
						</Text>
					) : (
						<Text size="xs" c="dimmed">
							In stock: {product.stock}
						</Text>
					)}
				</Group>
			</Stack>
		</Card>
	);
}
