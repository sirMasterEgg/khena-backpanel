import { Avatar, Badge, Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { OrderSalesDetailItem } from "@/api/orderSales";

interface PackChecklistProps {
	items: OrderSalesDetailItem[];
	/**
	 * Tandai satu item (berdasarkan `itemId`) sebagai sudah di-pack.
	 * Bila tidak diberikan, checklist tampil read-only (hanya status packing).
	 */
	onMarkPacked?: (itemId: string) => void;
	/** `itemId` yang sedang diproses — tombolnya menampilkan `loading`. */
	pendingItemId?: string | null;
	/** Tombol "Mark packed" tetap tampil tapi dinonaktifkan (order belum diproses). */
	disabled?: boolean;
}

/**
 * Daftar item order dengan status packing. Dipakai di langkah "Pack" (editable,
 * beri `onMarkPacked`) dan di ringkasan "Packed items" pada langkah Review
 * (read-only, tanpa `onMarkPacked`).
 */
export function PackChecklist({
	items,
	onMarkPacked,
	pendingItemId,
	disabled,
}: PackChecklistProps) {
	return (
		<Stack gap="sm">
			{items.map((item, index) => {
				const packed = item.isPacked ?? false;
				return (
					<Group key={item.id} justify="space-between" wrap="nowrap">
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
									color: packed ? "white" : "var(--mantine-color-gray-7)",
									backgroundColor: packed
										? "var(--mantine-color-green-6)"
										: "var(--mantine-color-gray-2)",
								}}
							>
								{packed ? (
									<IconCheck size={14} />
								) : (
									<Text size="xs" fw={700}>
										{index + 1}
									</Text>
								)}
							</Box>
							<Avatar src={item.imageUrl} radius="sm" size={40} />
							<Stack gap={2}>
								<Text size="sm">{item.name}</Text>
								<Text size="xs" c="dimmed">
									{item.sku} · Qty {item.quantity}
								</Text>
							</Stack>
						</Group>
						{packed ? (
							<Badge color="green" variant="light">
								Packed
							</Badge>
						) : onMarkPacked ? (
							<Button
								size="xs"
								variant="light"
								loading={pendingItemId === item.id}
								disabled={disabled}
								onClick={() => onMarkPacked(item.id)}
							>
								Mark packed
							</Button>
						) : (
							<Badge color="gray" variant="light">
								Not packed
							</Badge>
						)}
					</Group>
				);
			})}
		</Stack>
	);
}
