import { Button, SimpleGrid, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconBuildingBank,
	IconCash,
	IconCreditCard,
	IconQrcode,
	type TablerIcon,
} from "@tabler/icons-react";
import type { Customer } from "@/data/dummy";
import { formatCurrency } from "./format";
import type { PaymentMethod } from "./posTypes";

const METHODS: { value: PaymentMethod; label: string; Icon: TablerIcon }[] = [
	{ value: "cash", label: "Cash", Icon: IconCash },
	{ value: "card", label: "Card", Icon: IconCreditCard },
	{ value: "qris", label: "QRIS", Icon: IconQrcode },
	{ value: "transfer", label: "Transfer", Icon: IconBuildingBank },
];

interface TakePaymentArgs {
	total: number;
	itemCount: number;
	customer: Customer;
	onPaid: (method: PaymentMethod) => void;
}

interface TakePaymentBodyProps extends TakePaymentArgs {
	onPaid: (method: PaymentMethod) => void;
}

function TakePaymentBody({
	total,
	itemCount,
	customer,
	onPaid,
}: TakePaymentBodyProps) {
	return (
		<Stack gap="md">
			<Stack gap={0}>
				<Text size="sm" c="dimmed">
					Amount due
				</Text>
				<Text fz={40} fw={700} lh={1.1}>
					{formatCurrency(total)}
				</Text>
				<Text size="sm" c="dimmed" mt={4}>
					{itemCount} items · {customer.name}
				</Text>
			</Stack>

			<Text size="sm" fw={500}>
				Payment method
			</Text>
			<SimpleGrid cols={2} spacing="sm">
				{METHODS.map(({ value, label, Icon }) => (
					<Button
						key={value}
						variant="default"
						size="lg"
						h={64}
						leftSection={<Icon size={22} />}
						onClick={() => onPaid(value)}
					>
						{label}
					</Button>
				))}
			</SimpleGrid>

			<Text size="xs" c="dimmed">
				Payment is recorded immediately. No change calculation in this version.
			</Text>
		</Stack>
	);
}

/**
 * Buka modal "Take payment". `onPaid` dipanggil dengan metode terpilih
 * sebelum modal ditutup.
 */
export function openTakePaymentModal({
	total,
	itemCount,
	customer,
	onPaid,
}: TakePaymentArgs) {
	const id = modals.open({
		title: "Take payment",
		centered: true,
		children: (
			<TakePaymentBody
				total={total}
				itemCount={itemCount}
				customer={customer}
				onPaid={(method) => {
					modals.close(id);
					onPaid(method);
				}}
			/>
		),
	});
}
