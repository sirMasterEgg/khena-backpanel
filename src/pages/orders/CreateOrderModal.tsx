import {
	ActionIcon,
	Button,
	Group,
	NumberInput,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import type { Order, OrderItem } from "./orderTypes";

/** Satu baris item dalam form (qty bisa kosong sementara saat mengetik). */
type ItemDraft = {
	productName: string;
	qty: number | string;
};

interface CreateOrderFormProps {
	onSubmit: (order: Order) => void;
	onCancel: () => void;
}

function CreateOrderForm({ onSubmit, onCancel }: CreateOrderFormProps) {
	const [customerName, setCustomerName] = useState("");
	const [total, setTotal] = useState<number | string>("");
	const [items, setItems] = useState<ItemDraft[]>([
		{ productName: "", qty: 1 },
	]);

	const updateItem = (index: number, patch: Partial<ItemDraft>) => {
		setItems((prev) =>
			prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
		);
	};

	const addItem = () =>
		setItems((prev) => [...prev, { productName: "", qty: 1 }]);

	const removeItem = (index: number) =>
		setItems((prev) => prev.filter((_, i) => i !== index));

	const filledItems = items.filter(
		(item) => item.productName.trim().length > 0,
	);
	const canSubmit =
		customerName.trim().length > 0 &&
		filledItems.length > 0 &&
		Number(total) > 0;

	const handleSubmit = () => {
		if (!canSubmit) return;
		const orderItems: OrderItem[] = filledItems.map((item) => ({
			productName: item.productName.trim(),
			thumbnail: "https://placehold.co/40x40",
			qty: Math.max(1, Number(item.qty) || 1),
		}));
		const order: Order = {
			id: `ORD-${Date.now()}`,
			customerName: customerName.trim(),
			customerAvatarColor: "teal",
			items: orderItems,
			date: new Date().toISOString().slice(0, 10),
			total: Number(total),
			status: "pending",
		};
		onSubmit(order);
	};

	return (
		<Stack gap="md">
			<TextInput
				label="Customer name"
				placeholder="e.g. Andi Wijaya"
				required
				value={customerName}
				onChange={(e) => setCustomerName(e.currentTarget.value)}
			/>

			<Stack gap="xs">
				<Text size="sm" fw={500}>
					Items
				</Text>
				{items.map((item, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: baris item tanpa id stabil
					<Group key={index} gap="xs" align="flex-end" wrap="nowrap">
						<TextInput
							flex={1}
							placeholder="Product name"
							value={item.productName}
							onChange={(e) =>
								updateItem(index, { productName: e.currentTarget.value })
							}
						/>
						<NumberInput
							w={90}
							min={1}
							placeholder="Qty"
							value={item.qty}
							onChange={(value) => updateItem(index, { qty: value })}
						/>
						<ActionIcon
							variant="subtle"
							color="red"
							disabled={items.length === 1}
							onClick={() => removeItem(index)}
							aria-label="Remove item"
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
				))}
				<Button
					variant="subtle"
					size="compact-sm"
					leftSection={<IconPlus size={14} />}
					onClick={addItem}
					style={{ alignSelf: "flex-start" }}
				>
					Add item
				</Button>
			</Stack>

			<NumberInput
				label="Total"
				placeholder="0"
				required
				min={0}
				thousandSeparator="."
				decimalSeparator=","
				prefix="Rp "
				value={total}
				onChange={setTotal}
			/>

			<Group justify="flex-end" gap="sm">
				<Button variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!canSubmit}>
					Create order
				</Button>
			</Group>
		</Stack>
	);
}

/**
 * Buka modal "Create order" lewat modals manager (`@mantine/modals`).
 * `onSubmit` dipanggil dengan order baru sebelum modal ditutup.
 */
export function openCreateOrderModal(onSubmit: (order: Order) => void) {
	const id = modals.open({
		title: "Create order",
		centered: true,
		children: (
			<CreateOrderForm
				onSubmit={(order) => {
					onSubmit(order);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}
