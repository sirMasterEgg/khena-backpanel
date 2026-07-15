import { Avatar, Badge, Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { OrderItem } from "./orderTypes";

interface PackChecklistProps {
	items: OrderItem[];
	/**
	 * Tandai satu item (berdasarkan index) sebagai sudah di-pack.
	 * Bila tidak diberikan, checklist tampil read-only (hanya status packing).
	 */
	onMarkPacked?: (index: number) => void;
}

/**
 * Daftar item order dengan status packing. Dipakai di langkah "Pack" (editable,
 * beri `onMarkPacked`) dan di ringkasan "Packed items" pada langkah Review
 * (read-only, tanpa `onMarkPacked`).
 */
export function PackChecklist({ items, onMarkPacked }: PackChecklistProps) {
	return (
		<Stack gap="sm">
			{items.map((item, index) => (
				<Group
					key={item.sku ?? item.productName}
					justify="space-between"
					wrap="nowrap"
				>
					<Group gap="sm" wrap="nowrap">
						<Box
							style={{
								width: 24,
								height: 24,
								borderRadius: "50%",
								flex: "0 0 auto",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: item.packed ? "white" : "var(--mantine-color-gray-7)",
								backgroundColor: item.packed
									? "var(--mantine-color-green-6)"
									: "var(--mantine-color-gray-2)",
							}}
						>
							{item.packed ? (
								<IconCheck size={14} />
							) : (
								<Text size="xs" fw={700}>
									{index + 1}
								</Text>
							)}
						</Box>
						<Avatar src={item.thumbnail} radius="sm" size={40} />
						<Stack gap={2}>
							<Text size="sm">{item.productName}</Text>
							<Text size="xs" c="dimmed">
								{item.sku ?? "No SKU"} · qty {item.qty}
							</Text>
						</Stack>
					</Group>
					{item.packed ? (
						<Badge color="green" variant="light">
							Packed
						</Badge>
					) : onMarkPacked ? (
						<Button
							size="xs"
							variant="light"
							onClick={() => onMarkPacked(index)}
						>
							Mark packed
						</Button>
					) : (
						<Badge color="gray" variant="light">
							Not packed
						</Badge>
					)}
				</Group>
			))}
		</Stack>
	);
}
