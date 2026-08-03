import { Card, Group, Image, Indicator, Stack, Text } from "@mantine/core";
import type { PosVariant } from "@/api/pointOfSales";
import { formatCurrency } from "./format";

interface ProductCardProps {
	variant: PosVariant;
	/** Berapa banyak varian ini sudah ada di keranjang (untuk badge). */
	qtyInCart: number;
	/** Dipanggil saat kartu diklik (kecuali stok habis). */
	onAdd: () => void;
}

/** Kartu varian di katalog POS. Klik → tambah ke keranjang. */
export function ProductCard({ variant, qtyInCart, onAdd }: ProductCardProps) {
	const outOfStock = variant.stock === 0;

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
						src={variant.imageUrl}
						fallbackSrc="https://placehold.co/300x200?text=No+image"
						alt={variant.variantName}
						height={120}
						fit="cover"
					/>
				</Indicator>
			</Card.Section>

			<Stack gap={2} mt="sm">
				<Text fw={500} lineClamp={1}>
					{variant.variantName}
				</Text>
				<Text size="xs" c="dimmed">
					{variant.sku}
				</Text>
				<Group justify="space-between" mt={4} wrap="nowrap">
					<Text fw={600}>{formatCurrency(variant.price)}</Text>
					{outOfStock ? (
						<Text size="xs" c="red" fw={500}>
							Out of stock
						</Text>
					) : (
						<Text size="xs" c="dimmed">
							In stock: {variant.stock}
						</Text>
					)}
				</Group>
			</Stack>
		</Card>
	);
}
