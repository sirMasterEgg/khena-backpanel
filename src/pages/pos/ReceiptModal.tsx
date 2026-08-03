import { Button, Divider, Group, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPrinter } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { PosPaymentMethod } from "@/api/pointOfSales";
import { formatCurrency } from "./format";
import type { CompletedSale } from "./posTypes";

const METHOD_LABELS: Record<PosPaymentMethod, string> = {
	cash: "Cash",
	transfer: "Transfer",
	debit: "Debit card",
	credit: "Credit card",
	qris: "QRIS",
};

function ReceiptBody({ sale }: { sale: CompletedSale }) {
	const { order } = sale;

	return (
		<Stack gap="md">
			{/* Header struk */}
			<Stack gap={2} align="center">
				<Text fw={700} size="lg">
					Khena Furniture
				</Text>
				<Text size="xs" c="dimmed">
					{order.invoiceNumber}
				</Text>
				<Text size="xs" c="dimmed">
					{dayjs(order.orderDate).format("DD MMM YYYY")}
				</Text>
				<Text size="sm" mt={4}>
					Customer: {sale.customerName ?? "Walk-in customer"}
				</Text>
				{order.cashierName && (
					<Text size="xs" c="dimmed">
						Cashier: {order.cashierName}
					</Text>
				)}
			</Stack>

			<Divider variant="dashed" />

			{/* Daftar item */}
			<Stack gap="xs">
				{order.items.map((item) => (
					<Group
						key={item.detailProductId}
						justify="space-between"
						wrap="nowrap"
					>
						<Stack gap={0} style={{ minWidth: 0 }}>
							<Text size="sm" lineClamp={1}>
								{item.productName}
							</Text>
							<Text size="xs" c="dimmed">
								{item.quantity} × {formatCurrency(item.unitPrice)}
							</Text>
						</Stack>
						<Text size="sm" fw={500}>
							{formatCurrency(item.subtotal)}
						</Text>
					</Group>
				))}
			</Stack>

			<Divider variant="dashed" />

			{/* Total & metode */}
			<Group justify="space-between">
				<Text fw={700}>Total</Text>
				<Text fw={700} fz="xl">
					{formatCurrency(order.total)}
				</Text>
			</Group>
			<Group justify="space-between">
				<Text size="sm" c="dimmed">
					Payment method
				</Text>
				<Text size="sm">{METHOD_LABELS[order.paymentMethod]}</Text>
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
