import {
	Button,
	Center,
	Divider,
	Group,
	Loader,
	Modal,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/api/client";
import {
	getOrderSalesInvoices,
	getOrderSalesShippingLabels,
	type OrderSalesInvoice,
	type OrderSalesShippingLabel,
} from "@/api/orderSales";
import { formatCurrency, formatDate } from "./format";

/** Sama dengan batas server (400 maximum 50 ids per request). */
const MAX_IDS = 50;

type PrintDocumentModalProps = {
	opened: boolean;
	onClose: () => void;
	kind: "invoice" | "label";
	orderIds: string[];
};

function InvoiceDocument({ invoice }: { invoice: OrderSalesInvoice }) {
	return (
		<Stack gap="md" py="md">
			<Stack gap={0}>
				<Text fw={700} size="lg">
					{invoice.company.name}
				</Text>
				<Text size="sm" c="dimmed">
					{invoice.company.address}
				</Text>
				<Text size="sm" c="dimmed">
					{invoice.company.phone} · {invoice.company.email}
				</Text>
			</Stack>

			<Divider />

			<Group justify="space-between" align="flex-start">
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						Bill to
					</Text>
					<Text fw={500}>{invoice.customer.name}</Text>
					<Text size="sm" c="dimmed">
						{invoice.customer.address}
					</Text>
					<Text size="sm" c="dimmed">
						{invoice.customer.city}, {invoice.customer.province}{" "}
						{invoice.customer.zipCode}
					</Text>
					<Text size="sm" c="dimmed">
						{invoice.customer.phone} · {invoice.customer.email}
					</Text>
				</Stack>
				<Stack gap={0} align="flex-end">
					<Text size="sm" c="dimmed">
						Invoice number
					</Text>
					<Text fw={700}>{invoice.invoiceNumber}</Text>
					<Text size="sm" c="dimmed" mt="xs">
						Date
					</Text>
					<Text>{formatDate(invoice.date)}</Text>
				</Stack>
			</Group>

			<Table verticalSpacing="sm">
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Product</Table.Th>
						<Table.Th ta="center">Qty</Table.Th>
						<Table.Th ta="right">Unit price</Table.Th>
						<Table.Th ta="right">Subtotal</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{invoice.items.map((item) => (
						<Table.Tr key={item.sku}>
							<Table.Td>
								<Stack gap={2}>
									<Text size="sm">{item.name}</Text>
									<Text size="xs" c="dimmed">
										{item.sku}
									</Text>
								</Stack>
							</Table.Td>
							<Table.Td ta="center">{item.quantity}</Table.Td>
							<Table.Td ta="right">{formatCurrency(item.unitPrice)}</Table.Td>
							<Table.Td ta="right">{formatCurrency(item.subtotal)}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>

			<Stack gap="xs" align="flex-end">
				<Group gap="xl">
					<Text size="sm" c="dimmed">
						Subtotal
					</Text>
					<Text size="sm" w={140} ta="right">
						{formatCurrency(invoice.subtotal)}
					</Text>
				</Group>
				<Group gap="xl">
					<Text size="sm" c="dimmed">
						Shipping
					</Text>
					<Text size="sm" w={140} ta="right">
						{formatCurrency(invoice.shippingCost)}
					</Text>
				</Group>
				{invoice.discount > 0 && (
					<Group gap="xl">
						<Text size="sm" c="dimmed">
							Discount
						</Text>
						<Text size="sm" w={140} ta="right">
							-{formatCurrency(invoice.discount)}
						</Text>
					</Group>
				)}
				<Group gap="xl">
					<Text fw={700}>Total</Text>
					<Text fw={700} w={140} ta="right">
						{formatCurrency(invoice.total)}
					</Text>
				</Group>
			</Stack>

			{invoice.note && (
				<>
					<Divider />
					<Stack gap={2}>
						<Text size="sm" fw={500}>
							Note
						</Text>
						<Text size="sm" c="dimmed">
							{invoice.note}
						</Text>
					</Stack>
				</>
			)}
		</Stack>
	);
}

function ShippingLabelDocument({ label }: { label: OrderSalesShippingLabel }) {
	return (
		<Stack gap="md" py="md">
			<Group justify="space-between">
				<Text fw={700} size="lg">
					Shipping label
				</Text>
				<Text fw={500}>{label.invoiceNumber}</Text>
			</Group>

			<Divider />

			<Group grow align="flex-start">
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						From
					</Text>
					<Text fw={500}>{label.sender.name}</Text>
					<Text size="sm" c="dimmed">
						{label.sender.address}
					</Text>
					<Text size="sm" c="dimmed">
						{label.sender.zipCode}
					</Text>
					<Text size="sm" c="dimmed">
						{label.sender.phone}
					</Text>
				</Stack>
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						To
					</Text>
					<Text fw={500}>{label.recipient.name}</Text>
					<Text size="sm" c="dimmed">
						{label.recipient.address}
					</Text>
					<Text size="sm" c="dimmed">
						{label.recipient.city}, {label.recipient.province}{" "}
						{label.recipient.zipCode}
					</Text>
					<Text size="sm" c="dimmed">
						{label.recipient.phone}
					</Text>
				</Stack>
			</Group>

			<Divider />

			<Group gap="xl">
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						Tracking number
					</Text>
					<Text fw={500}>{label.trackingNumber ?? "—"}</Text>
				</Stack>
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						Total items
					</Text>
					<Text fw={500}>{label.totalItems}</Text>
				</Stack>
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						Weight
					</Text>
					<Text fw={500}>{(label.totalWeightGram / 1000).toFixed(2)} kg</Text>
				</Stack>
			</Group>

			{(label.deliveryDate || label.timeSlot || label.deliveryNotes) && (
				<>
					<Divider />
					<Stack gap={0}>
						<Text size="sm" c="dimmed">
							Delivery schedule
						</Text>
						<Text size="sm">
							{formatDate(label.deliveryDate)}
							{label.timeSlot ? ` · ${label.timeSlot}` : ""}
						</Text>
						{label.deliveryNotes && (
							<Text size="sm" c="dimmed">
								{label.deliveryNotes}
							</Text>
						)}
					</Stack>
				</>
			)}
		</Stack>
	);
}

/**
 * Modal render invoice / shipping label siap cetak. Data JSON dari server,
 * layout & cetaknya (`window.print()`) sepenuhnya di frontend.
 */
export function PrintDocumentModal({
	opened,
	onClose,
	kind,
	orderIds,
}: PrintDocumentModalProps) {
	const tooMany = orderIds.length > MAX_IDS;

	const { data, isLoading, isError, error } = useQuery<
		OrderSalesInvoice[] | OrderSalesShippingLabel[]
	>({
		queryKey: ["orders", "print", kind, orderIds],
		queryFn: () =>
			kind === "invoice"
				? getOrderSalesInvoices(orderIds)
				: getOrderSalesShippingLabels(orderIds),
		enabled: opened && orderIds.length > 0 && !tooMany,
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={kind === "invoice" ? "Print invoice" : "Print shipping label"}
			size="lg"
			centered
		>
			<style>{`
				@media print {
					body * { visibility: hidden; }
					.print-area, .print-area * { visibility: visible; }
					.print-area { position: absolute; top: 0; left: 0; width: 100%; }
					.print-area > * + * { page-break-before: always; }
				}
			`}</style>

			{tooMany ? (
				<Text c="red">Maksimal 50 order per cetak</Text>
			) : isLoading ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : isError ? (
				<Text c="red">{getApiErrorMessage(error)}</Text>
			) : (
				<>
					<div className="print-area">
						{kind === "invoice"
							? (data as OrderSalesInvoice[] | undefined)?.map((invoice) => (
									<InvoiceDocument
										key={invoice.invoiceNumber}
										invoice={invoice}
									/>
								))
							: (data as OrderSalesShippingLabel[] | undefined)?.map(
									(label) => (
										<ShippingLabelDocument
											key={label.invoiceNumber}
											label={label}
										/>
									),
								)}
					</div>

					<Group justify="flex-end" mt="md">
						<Button
							leftSection={<IconPrinter size={16} />}
							onClick={() => window.print()}
						>
							Print
						</Button>
					</Group>
				</>
			)}
		</Modal>
	);
}
