import { ActionIcon, Group, Image, Stack, Text } from "@mantine/core";
import { IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { formatCurrency } from "./format";
import type { CartItem } from "./posTypes";

interface CartItemRowProps {
	item: CartItem;
	onInc: () => void;
	onDec: () => void;
	onRemove: () => void;
}

/** Satu baris item di panel keranjang: thumbnail, nama, stepper qty, hapus. */
export function CartItemRow({
	item,
	onInc,
	onDec,
	onRemove,
}: CartItemRowProps) {
	const atMax = item.qty >= item.product.stock;

	return (
		<Group gap="xs" wrap="nowrap" align="center">
			<Image
				w={40}
				h={40}
				radius="sm"
				src={item.product.image}
				alt={item.product.name}
				fit="cover"
			/>
			<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
				<Text size="sm" fw={500} lineClamp={1}>
					{item.product.name}
				</Text>
				<Text size="xs" c="dimmed">
					{formatCurrency(item.product.price)}
				</Text>
			</Stack>
			<Group gap={4} wrap="nowrap">
				<ActionIcon variant="default" size="sm" onClick={onDec}>
					<IconMinus size={14} />
				</ActionIcon>
				<Text size="sm" fw={500} w={20} ta="center">
					{item.qty}
				</Text>
				<ActionIcon
					variant="default"
					size="sm"
					onClick={onInc}
					disabled={atMax}
				>
					<IconPlus size={14} />
				</ActionIcon>
			</Group>
			<ActionIcon variant="subtle" color="red" onClick={onRemove}>
				<IconTrash size={16} />
			</ActionIcon>
		</Group>
	);
}
