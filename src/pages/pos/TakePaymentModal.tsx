import { Button, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
import {
	IconBuildingBank,
	IconCash,
	IconCreditCard,
	IconQrcode,
	type TablerIcon,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { formatCurrency } from "./format";
import type { PaymentMethod } from "./posTypes";

const METHODS: { value: PaymentMethod; label: string; Icon: TablerIcon }[] = [
	{ value: "cash", label: "Cash", Icon: IconCash },
	{ value: "card", label: "Card", Icon: IconCreditCard },
	{ value: "qris", label: "QRIS", Icon: IconQrcode },
	{ value: "transfer", label: "Transfer", Icon: IconBuildingBank },
];

interface TakePaymentModalProps {
	opened: boolean;
	onClose: () => void;
	total: number;
	itemCount: number;
	customerName: string | null;
	loading: boolean;
	onPaid: (method: PaymentMethod) => void;
}

/** Modal "Take payment": pilih metode bayar, terkunci selagi request berjalan. */
export function TakePaymentModal({
	opened,
	onClose,
	total,
	itemCount,
	customerName,
	loading,
	onPaid,
}: TakePaymentModalProps) {
	const [pending, setPending] = useState<PaymentMethod | null>(null);

	useEffect(() => {
		if (opened) setPending(null);
	}, [opened]);

	const handlePaid = (method: PaymentMethod) => {
		setPending(method);
		onPaid(method);
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Take payment" centered>
			<Stack gap="md">
				<Stack gap={0}>
					<Text size="sm" c="dimmed">
						Amount due
					</Text>
					<Text fz={40} fw={700} lh={1.1}>
						{formatCurrency(total)}
					</Text>
					<Text size="sm" c="dimmed" mt={4}>
						{itemCount} items · {customerName ?? "Walk-in customer"}
					</Text>
				</Stack>

				<Text size="sm" fw={500}>
					Payment method
				</Text>
				<SimpleGrid cols={2} spacing="sm">
					{METHODS.map(({ value, label, Icon }) => (
						<Button
							key={value}
							type="button"
							variant="default"
							size="lg"
							h={64}
							leftSection={<Icon size={22} />}
							onClick={() => handlePaid(value)}
							loading={pending === value}
							disabled={loading}
						>
							{label}
						</Button>
					))}
				</SimpleGrid>
			</Stack>
		</Modal>
	);
}
