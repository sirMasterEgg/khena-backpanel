import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	Table,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import type {
	Product,
	PurchaseOrder,
	PurchaseOrderItem,
	PurchaseOrderStatus,
	Supplier,
} from "@/data/dummy";
import { formatCurrency, formatDate } from "./format";

// ----- Helper perhitungan -----

/** Total satu baris item = qty × unit cost. */
const lineTotal = (it: PurchaseOrderItem) => it.qty * it.unitCost;
/** Total keseluruhan (Rupiah) dari semua line item. */
const orderTotal = (items: PurchaseOrderItem[]) =>
	items.reduce((sum, it) => sum + lineTotal(it), 0);
/** Total kuantitas (untuk kolom "Items" & statistik). */
const totalQty = (items: PurchaseOrderItem[]) =>
	items.reduce((sum, it) => sum + it.qty, 0);

/**
 * Generate nomor PO berikutnya: ambil angka terbesar dari `code` yang ada,
 * lalu +1 dan di-pad 4 digit → mis. "PO-0009".
 */
export function nextPoCode(orders: PurchaseOrder[]): string {
	const max = orders.reduce((m, o) => {
		const n = Number.parseInt(o.code.replace(/\D/g, ""), 10);
		return Number.isNaN(n) ? m : Math.max(m, n);
	}, 0);
	return `PO-${String(max + 1).padStart(4, "0")}`;
}

interface PurchaseOrderFormProps {
	suppliers: Supplier[];
	/** Untuk dropdown "+ Add a product…". */
	products: Product[];
	/** Kalau diisi → mode edit; undefined → PO baru. */
	initial?: PurchaseOrder;
	/** Nomor PO (dari nextPoCode saat baru, atau initial.code saat edit). */
	code: string;
	/** Dipakai "Save draft" & "Mark as ordered". */
	onSubmit: (order: PurchaseOrder) => void;
	/** "Receive & add stock". */
	onReceive: (order: PurchaseOrder) => void;
	onDelete?: (order: PurchaseOrder) => void;
	onCancel: () => void;
}

/** Isi form modal "Add/Edit purchase order" berbasis line item. */
function PurchaseOrderForm({
	suppliers,
	products,
	initial,
	code,
	onSubmit,
	onReceive,
	onDelete,
	onCancel,
}: PurchaseOrderFormProps) {
	const [supplierId, setSupplierId] = useState<string | null>(
		initial ? String(initial.supplierId) : null,
	);
	const [date, setDate] = useState(
		initial?.date ?? new Date().toISOString().slice(0, 10),
	);
	const [expected, setExpected] = useState(initial?.expectedDate ?? "");
	const [items, setItems] = useState<PurchaseOrderItem[]>(
		initial?.lineItems ?? [],
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	// Reset value Select setelah menambah produk (uncontrolled-ish via key).
	const [addValue, setAddValue] = useState<string | null>(null);

	const isReceived = initial?.status === "received";
	const total = orderTotal(items);

	// ----- Aturan tombol footer -----
	const hasItems = items.length > 0;
	const canOrder = supplierId !== null && hasItems; // "Mark as ordered"
	const canReceive = hasItems; // "Receive & add stock"

	const supplierOptions = suppliers.map((s) => ({
		value: String(s.id),
		label: s.name,
	}));

	// Produk yang belum ada di daftar item (untuk dropdown tambah).
	const addableProducts = products.filter(
		(p) => !items.some((it) => it.productId === p.id),
	);

	/** Tambah produk baru ke daftar item (qty 1, unit cost = product.cost). */
	const addProduct = (val: string | null) => {
		if (!val) return;
		const product = products.find((p) => p.id === Number(val));
		if (!product) return;
		setItems((prev) => [
			...prev,
			{
				productId: product.id,
				name: product.name,
				sku: product.sku,
				qty: 1,
				unitCost: product.cost,
			},
		]);
		setAddValue(null); // reset dropdown
	};

	/** Ubah 1 field (qty / unitCost) pada item di index tertentu. */
	const updateItem = (
		index: number,
		patch: Partial<Pick<PurchaseOrderItem, "qty" | "unitCost">>,
	) => {
		setItems((prev) =>
			prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
		);
	};

	const removeItem = (index: number) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
	};

	/** Rakit objek PurchaseOrder dari state dengan status tertentu. */
	const build = (
		status: PurchaseOrderStatus,
		extra?: Partial<PurchaseOrder>,
	): PurchaseOrder => ({
		...(initial ?? {}),
		id: initial?.id ?? Date.now(),
		code,
		supplierId: Number(supplierId), // null → 0 (tabel menampilkan "—")
		date,
		expectedDate: expected || undefined,
		notes: notes.trim() || undefined,
		lineItems: items,
		items: totalQty(items), // recompute utk tabel & stats
		total: orderTotal(items), // recompute utk tabel & stats
		status,
		...extra,
	});

	return (
		<Stack gap="md">
			{isReceived && initial?.receivedAt && (
				<Alert color="green">
					Received on {formatDate(initial.receivedAt)} — stock was added to
					inventory.
				</Alert>
			)}

			<Group grow align="flex-start">
				<Select
					label="Supplier"
					placeholder="Select supplier"
					required
					data={supplierOptions}
					value={supplierId}
					onChange={setSupplierId}
					disabled={isReceived}
				/>
				<TextInput
					label="Order date"
					type="date"
					value={date}
					onChange={(e) => setDate(e.currentTarget.value)}
					disabled={isReceived}
				/>
				<TextInput
					label="Expected"
					type="date"
					value={expected}
					onChange={(e) => setExpected(e.currentTarget.value)}
					disabled={isReceived}
				/>
			</Group>

			<Stack gap="xs">
				<Text fw={500}>Items</Text>
				<Table verticalSpacing="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Product</Table.Th>
							<Table.Th style={{ width: 90 }}>Qty</Table.Th>
							<Table.Th style={{ width: 140 }}>Unit cost</Table.Th>
							<Table.Th style={{ width: 140 }}>Line total</Table.Th>
							<Table.Th style={{ width: 40 }} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{items.length === 0 ? (
							<Table.Tr>
								<Table.Td colSpan={5}>
									<Text c="dimmed" size="sm">
										No items yet — add a product below.
									</Text>
								</Table.Td>
							</Table.Tr>
						) : (
							items.map((it, index) => (
								<Table.Tr key={it.productId}>
									<Table.Td>
										<Stack gap={0}>
											<Text fw={500}>{it.name}</Text>
											<Text size="xs" c="dimmed">
												{it.sku}
											</Text>
										</Stack>
									</Table.Td>
									<Table.Td>
										<NumberInput
											min={1}
											value={it.qty}
											onChange={(val) =>
												updateItem(index, { qty: Number(val) || 0 })
											}
											disabled={isReceived}
										/>
									</Table.Td>
									<Table.Td>
										<NumberInput
											min={0}
											thousandSeparator="."
											decimalSeparator=","
											prefix="Rp "
											value={it.unitCost}
											onChange={(val) =>
												updateItem(index, { unitCost: Number(val) || 0 })
											}
											disabled={isReceived}
										/>
									</Table.Td>
									<Table.Td>
										<Text fw={700}>{formatCurrency(lineTotal(it))}</Text>
									</Table.Td>
									<Table.Td>
										{!isReceived && (
											<ActionIcon
												variant="subtle"
												color="gray"
												onClick={() => removeItem(index)}
												aria-label="Remove item"
											>
												<IconX size={16} />
											</ActionIcon>
										)}
									</Table.Td>
								</Table.Tr>
							))
						)}
					</Table.Tbody>
				</Table>

				{!isReceived && (
					<Select
						// Samakan lebar dengan kolom Product: total − (Qty 90 + Unit cost 140 + Line total 140 + aksi 40).
						w="calc(100% - 410px)"
						placeholder="+ Add a product…"
						searchable
						data={addableProducts.map((p) => ({
							value: String(p.id),
							label: `${p.name} (${p.sku})`,
						}))}
						value={addValue}
						onChange={addProduct}
					/>
				)}
			</Stack>

			<Box
				style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
				pt="sm"
			>
				<Group justify="flex-end" gap="sm">
					<Text c="dimmed">Total at cost</Text>
					<Text fw={700}>{formatCurrency(total)}</Text>
				</Group>
			</Box>

			<Textarea
				label="Notes"
				placeholder="Catatan pesanan (opsional)"
				autosize
				minRows={2}
				value={notes}
				onChange={(e) => setNotes(e.currentTarget.value)}
				disabled={isReceived}
			/>

			<Group justify="flex-end" gap="sm">
				{isReceived ? (
					<Button variant="default" onClick={onCancel}>
						Close
					</Button>
				) : (
					<>
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
						<Button variant="default" onClick={() => onSubmit(build("draft"))}>
							Save draft
						</Button>
						<Button
							variant="default"
							disabled={!canOrder}
							onClick={() => onSubmit(build("ordered"))}
						>
							Mark as ordered
						</Button>
						<Button
							disabled={!canReceive}
							onClick={() =>
								onReceive(
									build("received", {
										receivedAt: new Date().toISOString().slice(0, 10),
									}),
								)
							}
						>
							Receive &amp; add stock
						</Button>
					</>
				)}
			</Group>
		</Stack>
	);
}

/**
 * Buka modal "New purchase order" lewat modals manager (`@mantine/modals`).
 * `code` sudah dihitung pemanggil (nextPoCode) dan ditampilkan di judul.
 */
export function openAddPurchaseOrderModal(
	code: string,
	suppliers: Supplier[],
	products: Product[],
	onSubmit: (order: PurchaseOrder) => void,
	onReceive: (order: PurchaseOrder) => void,
) {
	const id = modals.open({
		title: code,
		centered: true,
		size: "xl",
		children: (
			<PurchaseOrderForm
				code={code}
				suppliers={suppliers}
				products={products}
				onSubmit={(order) => {
					onSubmit(order);
					modals.close(id);
				}}
				onReceive={(order) => {
					onReceive(order);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}

/**
 * Buka modal "Edit purchase order" dengan form terisi awal dari `order`.
 * PO yang sudah `received` tampil read-only dengan judul ` · Received`.
 */
export function openEditPurchaseOrderModal(
	order: PurchaseOrder,
	suppliers: Supplier[],
	products: Product[],
	onSubmit: (updated: PurchaseOrder) => void,
	onReceive: (updated: PurchaseOrder) => void,
	onDelete?: (order: PurchaseOrder) => void,
) {
	const id = modals.open({
		title:
			order.status === "received" ? `${order.code} · Received` : order.code,
		centered: true,
		size: "xl",
		children: (
			<PurchaseOrderForm
				initial={order}
				code={order.code}
				suppliers={suppliers}
				products={products}
				onSubmit={(updated) => {
					onSubmit(updated);
					modals.close(id);
				}}
				onReceive={(updated) => {
					onReceive(updated);
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
