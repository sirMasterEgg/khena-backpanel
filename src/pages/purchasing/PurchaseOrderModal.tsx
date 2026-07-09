import {
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";
import type {
	PurchaseOrder,
	PurchaseOrderStatus,
	Supplier,
} from "@/data/dummy";

/** Opsi status untuk dropdown, urut sesuai alur PO. */
const STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string }[] = [
	{ value: "draft", label: "Draft" },
	{ value: "ordered", label: "Ordered" },
	{ value: "partial", label: "Partial" },
	{ value: "received", label: "Received" },
	{ value: "cancelled", label: "Cancelled" },
];

interface PurchaseOrderFormProps {
	onSubmit: (order: PurchaseOrder) => void;
	onCancel: () => void;
	/** Daftar supplier untuk mengisi dropdown "Supplier". */
	suppliers: Supplier[];
	/** Kalau diisi → mode edit: field terisi awal & tombol Delete muncul. */
	initial?: PurchaseOrder;
	/** Dipanggil saat tombol Delete ditekan (hanya di mode edit). */
	onDelete?: (order: PurchaseOrder) => void;
	/** Label tombol submit (default "Save purchase order"). */
	submitLabel?: string;
}

/** Isi form modal "Add/Edit purchase order". State dikelola sendiri. */
function PurchaseOrderForm({
	onSubmit,
	onCancel,
	suppliers,
	initial,
	onDelete,
	submitLabel = "Save purchase order",
}: PurchaseOrderFormProps) {
	const [code, setCode] = useState(initial?.code ?? "");
	const [supplierId, setSupplierId] = useState<string | null>(
		initial ? String(initial.supplierId) : null,
	);
	const [date, setDate] = useState(
		initial?.date ?? new Date().toISOString().slice(0, 10),
	);
	const [items, setItems] = useState<number | string>(initial?.items ?? 0);
	const [total, setTotal] = useState<number | string>(initial?.total ?? 0);
	const [status, setStatus] = useState<PurchaseOrderStatus>(
		initial?.status ?? "draft",
	);

	// Supplier & nomor PO wajib.
	const canSubmit = code.trim().length > 0 && supplierId !== null;

	const supplierOptions = suppliers.map((s) => ({
		value: String(s.id),
		label: s.name,
	}));

	const handleSubmit = () => {
		if (!canSubmit || supplierId === null) return;
		const order: PurchaseOrder = initial
			? {
					...initial,
					code: code.trim(),
					supplierId: Number(supplierId),
					date,
					items: Number(items) || 0,
					total: Number(total) || 0,
					status,
				}
			: {
					id: Date.now(),
					code: code.trim(),
					supplierId: Number(supplierId),
					date,
					items: Number(items) || 0,
					total: Number(total) || 0,
					status,
				};
		onSubmit(order);
	};

	return (
		<Stack gap="md">
			<TextInput
				label="PO number"
				placeholder="e.g. PO-0009"
				required
				value={code}
				onChange={(e) => setCode(e.currentTarget.value)}
			/>
			<Select
				label="Supplier"
				placeholder="Select supplier"
				required
				data={supplierOptions}
				value={supplierId}
				onChange={setSupplierId}
			/>
			<TextInput
				label="Date"
				type="date"
				value={date}
				onChange={(e) => setDate(e.currentTarget.value)}
			/>
			<Group grow align="flex-start">
				<NumberInput label="Items" min={0} value={items} onChange={setItems} />
				<NumberInput
					label="Total"
					min={0}
					thousandSeparator="."
					decimalSeparator=","
					prefix="Rp "
					value={total}
					onChange={setTotal}
				/>
			</Group>
			<Select
				label="Status"
				data={STATUS_OPTIONS}
				value={status}
				onChange={(val) => setStatus((val as PurchaseOrderStatus) ?? "draft")}
				allowDeselect={false}
			/>

			<Group justify="flex-end" gap="sm">
				{initial && onDelete && (
					<Button
						color="red"
						variant="light"
						mr="auto"
						onClick={() => onDelete(initial)}
					>
						Delete
					</Button>
				)}
				<Button variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!canSubmit}>
					{submitLabel}
				</Button>
			</Group>
		</Stack>
	);
}

/**
 * Buka modal "New purchase order" lewat modals manager (`@mantine/modals`).
 * `onSubmit` dipanggil dengan PO baru sebelum modal ditutup.
 */
export function openAddPurchaseOrderModal(
	suppliers: Supplier[],
	onSubmit: (order: PurchaseOrder) => void,
) {
	const id = modals.open({
		title: "New purchase order",
		centered: true,
		children: (
			<PurchaseOrderForm
				suppliers={suppliers}
				onSubmit={(order) => {
					onSubmit(order);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}

/**
 * Buka modal "Edit purchase order" dengan form terisi awal dari `order`.
 * `onSubmit` menerima PO yang sudah digabung dengan perubahan form,
 * `onDelete` (opsional) dipanggil saat PO dihapus.
 */
export function openEditPurchaseOrderModal(
	order: PurchaseOrder,
	suppliers: Supplier[],
	onSubmit: (updated: PurchaseOrder) => void,
	onDelete?: (order: PurchaseOrder) => void,
) {
	const id = modals.open({
		title: "Edit purchase order",
		centered: true,
		children: (
			<PurchaseOrderForm
				initial={order}
				suppliers={suppliers}
				submitLabel="Save purchase order"
				onSubmit={(updated) => {
					onSubmit(updated);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
				onDelete={
					onDelete
						? (target) => {
								onDelete(target);
								modals.close(id);
							}
						: undefined
				}
			/>
		),
	});
}
