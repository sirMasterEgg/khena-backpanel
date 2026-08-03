import { Button, Divider, Group, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPrinter } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { OrderSalesOrder, OrderSalesPaymentMethod } from "@/api/orderSales";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "./format";

const METHOD_LABELS: Record<OrderSalesPaymentMethod, string> = {
	cash: "Cash",
	transfer: "Transfer",
	debit: "Debit card",
	credit: "Credit card",
	qris: "QRIS",
};

function OrderCreatedBody({
	order,
	customerName,
}: {
	order: OrderSalesOrder;
	customerName: string;
}) {
	return (
		<Stack gap="md">
			{/* Header */}
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
					Customer: {customerName}
				</Text>
				<StatusBadge status="pending" />
			</Stack>

			<Divider variant="dashed" />

			{/* Alamat kirim */}
			<Stack gap={2}>
				<Text fw={700} size="sm">
					Shipping address
				</Text>
				<Text size="sm">{order.shippingAddress}</Text>
				<Text size="sm">
					{order.shippingCity}, {order.shippingProvince}{" "}
					{order.shippingZipCode}
				</Text>
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

			{/* Ringkasan */}
			<Stack gap="xs">
				<Group justify="space-between">
					<Text size="sm" c="dimmed">
						Subtotal
					</Text>
					<Text size="sm">{formatCurrency(order.totalAmount)}</Text>
				</Group>
				<Group justify="space-between">
					<Text size="sm" c="dimmed">
						Shipping
					</Text>
					<Text size="sm">{formatCurrency(order.shippingAmount)}</Text>
				</Group>
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

			{order.note && (
				<>
					<Divider variant="dashed" />
					<Stack gap={2}>
						<Text fw={700} size="sm">
							Internal note
						</Text>
						<Text size="sm">{order.note}</Text>
					</Stack>
				</>
			)}
		</Stack>
	);
}

/** Buka modal ringkasan setelah order sales berhasil dibuat. */
export function openOrderCreatedModal(
	order: OrderSalesOrder,
	customerName: string,
) {
	const id = modals.open({
		title: "Order created",
		centered: true,
		children: (
			<Stack gap="lg">
				<OrderCreatedBody order={order} customerName={customerName} />
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
