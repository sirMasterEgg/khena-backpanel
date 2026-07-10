import { Button, Divider, Group, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPrinter } from "@tabler/icons-react";
import { formatCurrency, formatDate } from "./format";
import type { CompletedSale, PaymentMethod } from "./posTypes";

const METHOD_LABELS: Record<PaymentMethod, string> = {
	cash: "Cash",
	card: "Card",
	qris: "QRIS",
	transfer: "Transfer",
};

function ReceiptBody({ sale }: { sale: CompletedSale }) {
	return (
		<Stack gap="md">
			{/* Header struk */}
			<Stack gap={2} align="center">
				<Text fw={700} size="lg">
					Khena Furniture
				</Text>
				<Text size="xs" c="dimmed">
					{sale.id}
				</Text>
				<Text size="xs" c="dimmed">
					{formatDate(sale.createdAt)}
				</Text>
				<Text size="sm" mt={4}>
					Customer: {sale.customer.name}
				</Text>
			</Stack>

			<Divider variant="dashed" />

			{/* Daftar item */}
			<Stack gap="xs">
				{sale.items.map((item) => (
					<Group key={item.product.id} justify="space-between" wrap="nowrap">
						<Stack gap={0} style={{ minWidth: 0 }}>
							<Text size="sm" lineClamp={1}>
								{item.product.name}
							</Text>
							<Text size="xs" c="dimmed">
								{item.qty} × {formatCurrency(item.product.price)}
							</Text>
						</Stack>
						<Text size="sm" fw={500}>
							{formatCurrency(item.product.price * item.qty)}
						</Text>
					</Group>
				))}
			</Stack>

			<Divider variant="dashed" />

			{/* Total & metode */}
			<Group justify="space-between">
				<Text fw={700}>Total</Text>
				<Text fw={700} fz="xl">
					{formatCurrency(sale.total)}
				</Text>
			</Group>
			<Group justify="space-between">
				<Text size="sm" c="dimmed">
					Payment method
				</Text>
				<Text size="sm">{METHOD_LABELS[sale.paymentMethod]}</Text>
			</Group>
		</Stack>
	);
}

/** Buka modal struk untuk penjualan yang sudah selesai. */
export function openReceiptModal(sale: CompletedSale) {
	const id = modals.open({
		title: "Receipt",
		centered: true,
		children: (
			<Stack gap="lg">
				<ReceiptBody sale={sale} />
				<Group justify="flex-end" gap="sm">
					<Button variant="default" onClick={() => modals.close(id)}>
						Close
					</Button>
					<Button
						leftSection={<IconPrinter size={16} />}
						onClick={() => window.print()}
					>
						Print
					</Button>
				</Group>
			</Stack>
		),
	});
}
