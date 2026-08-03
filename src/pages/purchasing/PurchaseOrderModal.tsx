import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Modal,
	NumberInput,
	Select,
	Stack,
	Table,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/api/client";
import { getProduct, listProducts } from "@/api/products";
import {
	createPurchaseOrder,
	createPurchaseOrderDraft,
	getPurchaseOrder,
	patchPurchaseOrder,
	PO_ALLOWED_TRANSITIONS,
	type PurchaseOrderDraftInput,
	type PurchaseOrderInput,
	type PurchaseOrderPatchInput,
} from "@/api/purchaseOrders";
import { listSuppliers } from "@/api/suppliers";
import { notify } from "@/components/notify";
import { formatCurrency } from "./format";
import {
	MIN_ITEMS_MESSAGE,
	type PurchaseOrderFormData,
	purchaseOrderSchema,
} from "./purchaseOrderSchema";

interface PurchaseOrderModalProps {
	opened: boolean;
	/** Ada → mode edit. Modal fetch detail sendiri lewat GET /purchase-orders/:id. */
	purchaseOrderId?: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const emptyFormValues: PurchaseOrderFormData = {
	supplierId: "",
	orderDate: new Date().toISOString().slice(0, 10),
	expectedDeliveryDate: "",
	note: "",
	products: [],
};

export function PurchaseOrderModal({
	opened,
	purchaseOrderId,
	onClose,
	onSuccess,
}: PurchaseOrderModalProps) {
	const isEditing = Boolean(purchaseOrderId);

	const detailQuery = useQuery({
		queryKey: ["purchase-orders", purchaseOrderId],
		queryFn: () => getPurchaseOrder(purchaseOrderId as string),
		enabled: opened && Boolean(purchaseOrderId),
	});
	const detail = detailQuery.data;

	const suppliersQuery = useQuery({
		queryKey: ["suppliers", { limit: 100 }],
		queryFn: () => listSuppliers({ limit: 100 }),
		enabled: opened,
	});
	const supplierOptions = (suppliersQuery.data?.data ?? []).map((s) => ({
		value: s.id,
		label: s.name,
	}));

	const {
		control,
		register,
		handleSubmit,
		reset,
		setError,
		watch,
		formState: { errors, isDirty },
	} = useForm<PurchaseOrderFormData>({
		resolver: zodResolver(purchaseOrderSchema),
		defaultValues: emptyFormValues,
	});
	const { fields, append, remove } = useFieldArray({
		control,
		name: "products",
	});

	useEffect(() => {
		if (!opened) return;
		if (detail) {
			reset({
				supplierId: detail.supplierId,
				orderDate: detail.orderDate,
				expectedDeliveryDate: detail.expectedDeliveryDate ?? "",
				note: detail.note ?? "",
				products: detail.products.map((p) => ({
					detailProductId: p.detailProductId,
					productName: p.productName,
					sku: p.sku,
					quantity: p.quantity,
					unitCost: p.unitCost,
				})),
			});
		} else if (!purchaseOrderId) {
			reset(emptyFormValues);
		}
	}, [opened, detail, purchaseOrderId, reset]);

	const products = watch("products");
	const total = products.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);

	// ----- Picker produk 2 langkah (keputusan 2.1) -----
	const [productId, setProductId] = useState<string | null>(null);
	const [variantId, setVariantId] = useState<string | null>(null);
	const [productSearch, setProductSearch] = useState("");
	const [debouncedProductSearch] = useDebouncedValue(productSearch, 300);

	const productsListQuery = useQuery({
		queryKey: ["products", { search: debouncedProductSearch, limit: 20 }],
		queryFn: () =>
			listProducts({ search: debouncedProductSearch || undefined, limit: 20 }),
		enabled: opened,
	});
	const productOptions = (productsListQuery.data?.data ?? []).map((p) => ({
		value: p.id,
		label: `${p.name} (${p.baseSku})`,
	}));

	const productDetailQuery = useQuery({
		queryKey: ["products", productId],
		queryFn: () => getProduct(productId as string),
		enabled: Boolean(productId),
	});
	const variantOptions = (productDetailQuery.data?.variants ?? [])
		.filter((v) => !products.some((p) => p.detailProductId === v.id))
		.map((v) => ({ value: v.id, label: v.detailProductSku }));

	const resetPicker = () => {
		setProductId(null);
		setVariantId(null);
		setProductSearch("");
	};

	const addItem = () => {
		const variant = productDetailQuery.data?.variants.find(
			(v) => v.id === variantId,
		);
		if (!variant || !productDetailQuery.data) return;
		append({
			detailProductId: variant.id,
			productName: productDetailQuery.data.name,
			sku: variant.detailProductSku,
			quantity: 1,
			unitCost: variant.capitalPrice,
		});
		resetPicker();
	};

	// ----- Status & mode (keputusan 2.2) -----
	const status = detail?.status;
	const isNew = !status;
	const isDraft = status === "draft";
	const isReadOnly = status === "received" || status === "cancelled";
	// Pengaman tambahan terhadap PO_ALLOWED_TRANSITIONS.
	const canPromote =
		status === "draft" && PO_ALLOWED_TRANSITIONS.draft.includes("ordered");
	const canReceive =
		status === "ordered" && PO_ALLOWED_TRANSITIONS.ordered.includes("received");
	const canCancel = status
		? PO_ALLOWED_TRANSITIONS[status].includes("cancelled")
		: false;

	const buildProductsBody = (data: PurchaseOrderFormData) =>
		data.products.map((p) => ({
			detailProductId: p.detailProductId,
			quantity: p.quantity,
			unitCost: p.unitCost,
		}));

	/** Field non-item untuk POST — field kosong dikirim sebagai `undefined`. */
	const buildCreateBody = (data: PurchaseOrderFormData) => ({
		supplierId: data.supplierId,
		orderDate: data.orderDate,
		expectedDeliveryDate: data.expectedDeliveryDate || undefined,
		note: data.note.trim() || undefined,
	});

	/** Field non-item untuk PATCH — field kosong dikirim sebagai `null` (dikosongkan). */
	const buildPatchBody = (data: PurchaseOrderFormData) => ({
		supplierId: data.supplierId,
		orderDate: data.orderDate,
		expectedDeliveryDate: data.expectedDeliveryDate || null,
		note: data.note.trim() || null,
	});

	/** Submit yang menolak PO tanpa item — dipakai jalur "Mark as ordered". */
	const submitWithItems = (action: (data: PurchaseOrderFormData) => void) =>
		handleSubmit((data) => {
			if (data.products.length === 0) {
				setError("products", { message: MIN_ITEMS_MESSAGE });
				return;
			}
			action(data);
		});

	const onMutationSuccess = (message: string) => {
		notify.success(message);
		onSuccess?.();
		onClose();
	};
	const onMutationError = (error: unknown) =>
		notify.error(getApiErrorMessage(error));

	const createMutation = useMutation({
		mutationFn: (data: PurchaseOrderFormData) => {
			const body: PurchaseOrderInput = {
				...buildCreateBody(data),
				products: buildProductsBody(data),
			};
			return createPurchaseOrder(body);
		},
		onSuccess: () => onMutationSuccess("Purchase order dibuat"),
		onError: onMutationError,
	});

	// Draft boleh tanpa item — `products` di-omit kalau kosong.
	const draftMutation = useMutation({
		mutationFn: (data: PurchaseOrderFormData) => {
			const items = buildProductsBody(data);
			const body: PurchaseOrderDraftInput = {
				...buildCreateBody(data),
				products: items.length > 0 ? items : undefined,
			};
			return createPurchaseOrderDraft(body);
		},
		onSuccess: () => onMutationSuccess("Draft disimpan"),
		onError: onMutationError,
	});

	const saveMutation = useMutation({
		mutationFn: (data: PurchaseOrderFormData) => {
			const items = buildProductsBody(data);
			const body: PurchaseOrderPatchInput = {
				...buildPatchBody(data),
				// Server menolak `products: []` (aturannya sama dengan POST), jadi item
				// hanya dikirim kalau ada isinya.
				...(items.length > 0 ? { products: items } : {}),
			};
			return patchPurchaseOrder(purchaseOrderId as string, body);
		},
		onSuccess: () => onMutationSuccess("Purchase order diperbarui"),
		onError: onMutationError,
	});

	// Promosi draft → ordered. Field form ikut dikirim dalam PATCH yang sama supaya
	// item yang baru ditambahkan langsung terhitung (kontrak bagian 16).
	const promoteMutation = useMutation({
		mutationFn: (data: PurchaseOrderFormData) => {
			const body: PurchaseOrderPatchInput = {
				...buildPatchBody(data),
				products: buildProductsBody(data),
				status: "ordered",
			};
			return patchPurchaseOrder(purchaseOrderId as string, body);
		},
		onSuccess: () => onMutationSuccess("Purchase order ditandai ordered"),
		onError: onMutationError,
	});

	const receiveMutation = useMutation({
		mutationFn: () =>
			patchPurchaseOrder(purchaseOrderId as string, { status: "received" }),
		onSuccess: () =>
			onMutationSuccess("Purchase order diterima — stok bertambah"),
		onError: onMutationError,
	});

	const cancelMutation = useMutation({
		mutationFn: () =>
			patchPurchaseOrder(purchaseOrderId as string, { status: "cancelled" }),
		onSuccess: () => onMutationSuccess("Purchase order dibatalkan"),
		onError: onMutationError,
	});

	// PATCH tidak bisa mengosongkan item (server menolak `products: []`), jadi
	// penghapusan seluruh item ditolak di sini supaya tidak gagal diam-diam.
	const submitSave = handleSubmit((data) => {
		if (data.products.length === 0 && (detail?.products.length ?? 0) > 0) {
			setError("products", {
				message:
					"Item tidak bisa dikosongkan — hapus PO ini atau sisakan minimal 1 item",
			});
			return;
		}
		saveMutation.mutate(data);
	});

	// Konfirmasi dibuka dari dalam Modal yang sedang terbuka, jadi z-index-nya harus
	// di atas z-index default Mantine Modal (200) supaya tidak tertutup overlay.
	const CONFIRM_Z_INDEX = 1000;

	const confirmPromote = (data: PurchaseOrderFormData) => {
		modals.openConfirmModal({
			title: "Mark as ordered",
			zIndex: CONFIRM_Z_INDEX,
			children: (
				<Text size="sm">
					Purchase order dikirim ke supplier dan tidak bisa dikembalikan ke
					draft.
				</Text>
			),
			labels: { confirm: "Mark as ordered", cancel: "Cancel" },
			onConfirm: () => promoteMutation.mutate(data),
		});
	};

	const confirmReceive = () => {
		modals.openConfirmModal({
			title: "Receive & add stock",
			zIndex: CONFIRM_Z_INDEX,
			children: (
				<Text size="sm">
					Stok tiap item akan ditambahkan ke inventory dan status tidak bisa
					diubah lagi.
				</Text>
			),
			labels: { confirm: "Receive", cancel: "Cancel" },
			onConfirm: () => receiveMutation.mutate(),
		});
	};

	const confirmCancelOrder = () => {
		modals.openConfirmModal({
			title: "Cancel order",
			zIndex: CONFIRM_Z_INDEX,
			children: (
				<Text size="sm">
					Purchase order akan dibatalkan dan tidak bisa diaktifkan kembali.
				</Text>
			),
			labels: { confirm: "Cancel order", cancel: "Back" },
			confirmProps: { color: "red" },
			onConfirm: () => cancelMutation.mutate(),
		});
	};

	const isLoadingDetail = isEditing && detailQuery.isLoading;
	const isMutating =
		createMutation.isPending ||
		draftMutation.isPending ||
		saveMutation.isPending ||
		promoteMutation.isPending ||
		receiveMutation.isPending ||
		cancelMutation.isPending;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={detail?.invoiceNumber ?? "New purchase order"}
			centered
			size="xl"
		>
			{isLoadingDetail ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : (
				<Stack gap="md">
					{status === "received" && (
						<Alert color="green">
							PO ini sudah diterima — stok sudah masuk ke inventory.
						</Alert>
					)}
					{status === "cancelled" && (
						<Alert color="gray">Purchase order ini sudah dibatalkan.</Alert>
					)}

					<Group grow align="flex-start">
						<Controller
							name="supplierId"
							control={control}
							render={({ field }) => (
								<Select
									label="Supplier"
									placeholder="Select supplier"
									required
									searchable
									data={supplierOptions}
									value={field.value || null}
									onChange={(val) => field.onChange(val ?? "")}
									error={errors.supplierId?.message}
									disabled={isReadOnly}
								/>
							)}
						/>
						<TextInput
							label="Order date"
							type="date"
							required
							{...register("orderDate")}
							error={errors.orderDate?.message}
							disabled={isReadOnly}
						/>
						<TextInput
							label="Expected delivery"
							type="date"
							{...register("expectedDeliveryDate")}
							error={errors.expectedDeliveryDate?.message}
							disabled={isReadOnly}
						/>
					</Group>

					{!isReadOnly && (
						<Stack gap="xs">
							<Text fw={500} size="sm">
								Add item
							</Text>
							<Group align="flex-end" gap="sm">
								<Select
									label="Product"
									placeholder="Cari produk…"
									searchable
									w={280}
									data={productOptions}
									value={productId}
									searchValue={productSearch}
									onSearchChange={setProductSearch}
									onChange={(val) => {
										setProductId(val);
										setVariantId(null);
									}}
								/>
								<Select
									label="Variant (SKU)"
									placeholder="Pilih varian"
									w={220}
									data={variantOptions}
									value={variantId}
									onChange={setVariantId}
									disabled={!productId}
								/>
								<Button
									type="button"
									variant="light"
									disabled={!variantId}
									onClick={addItem}
								>
									+ Tambah ke item
								</Button>
							</Group>
						</Stack>
					)}

					<Stack gap="xs">
						<Text fw={500}>Items</Text>
						<Table verticalSpacing="sm">
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Produk / SKU</Table.Th>
									<Table.Th style={{ width: 90 }}>Qty</Table.Th>
									<Table.Th style={{ width: 140 }}>Unit cost</Table.Th>
									<Table.Th style={{ width: 140 }}>Subtotal</Table.Th>
									{!isReadOnly && <Table.Th style={{ width: 40 }} />}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{fields.length === 0 ? (
									<Table.Tr>
										<Table.Td colSpan={isReadOnly ? 4 : 5}>
											<Text c="dimmed" size="sm">
												No items yet — add a product above.
											</Text>
										</Table.Td>
									</Table.Tr>
								) : (
									fields.map((field, index) => {
										const it = products[index] ?? field;
										return (
											<Table.Tr key={field.id}>
												<Table.Td>
													<Stack gap={0}>
														<Text fw={500}>{it.productName}</Text>
														<Text size="xs" c="dimmed">
															{it.sku}
														</Text>
													</Stack>
												</Table.Td>
												<Table.Td>
													<Controller
														name={`products.${index}.quantity`}
														control={control}
														render={({ field: f }) => (
															<NumberInput
																min={1}
																value={f.value}
																onChange={(val) =>
																	f.onChange(typeof val === "number" ? val : 1)
																}
																disabled={isReadOnly}
															/>
														)}
													/>
												</Table.Td>
												<Table.Td>
													<Controller
														name={`products.${index}.unitCost`}
														control={control}
														render={({ field: f }) => (
															<NumberInput
																min={0}
																thousandSeparator="."
																decimalSeparator=","
																prefix="Rp "
																value={f.value}
																onChange={(val) =>
																	f.onChange(typeof val === "number" ? val : 0)
																}
																disabled={isReadOnly}
															/>
														)}
													/>
												</Table.Td>
												<Table.Td>
													<Text fw={700}>
														{formatCurrency(it.quantity * it.unitCost)}
													</Text>
												</Table.Td>
												{!isReadOnly && (
													<Table.Td>
														<ActionIcon
															variant="subtle"
															color="gray"
															onClick={() => remove(index)}
															aria-label="Remove item"
														>
															<IconX size={16} />
														</ActionIcon>
													</Table.Td>
												)}
											</Table.Tr>
										);
									})
								)}
							</Table.Tbody>
						</Table>
						{errors.products?.message && (
							<Text c="red" size="sm">
								{errors.products.message}
							</Text>
						)}
					</Stack>

					<Box
						style={{
							borderTop: "1px solid var(--mantine-color-default-border)",
						}}
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
						{...register("note")}
						disabled={isReadOnly}
					/>

					<Group justify="flex-end" gap="sm">
						{!isReadOnly && !isNew && canCancel && (
							<Button
								type="button"
								color="red"
								variant="light"
								mr="auto"
								disabled={isMutating}
								onClick={confirmCancelOrder}
							>
								Cancel order
							</Button>
						)}

						{isReadOnly ? (
							<Button type="button" variant="default" onClick={onClose}>
								Close
							</Button>
						) : (
							<>
								<Button type="button" variant="default" onClick={onClose}>
									Cancel
								</Button>

								{isNew ? (
									<>
										<Button
											type="button"
											variant="default"
											onClick={handleSubmit((data) =>
												draftMutation.mutate(data),
											)}
											loading={draftMutation.isPending}
											disabled={isMutating}
										>
											Save as draft
										</Button>
										<Button
											type="button"
											onClick={submitWithItems((data) =>
												createMutation.mutate(data),
											)}
											loading={createMutation.isPending}
											disabled={isMutating}
										>
											Mark as ordered
										</Button>
									</>
								) : (
									<>
										<Button
											type="button"
											variant="default"
											onClick={submitSave}
											loading={saveMutation.isPending}
											disabled={isMutating}
										>
											{isDraft ? "Save as draft" : "Save changes"}
										</Button>
										{isDraft ? (
											<Button
												type="button"
												onClick={submitWithItems(confirmPromote)}
												loading={promoteMutation.isPending}
												disabled={isMutating || !canPromote}
											>
												Mark as ordered
											</Button>
										) : (
											<Tooltip
												label="Simpan perubahan dulu"
												disabled={!isDirty}
											>
												<Box>
													<Button
														type="button"
														onClick={confirmReceive}
														loading={receiveMutation.isPending}
														disabled={isMutating || isDirty || !canReceive}
													>
														Receive &amp; add stock
													</Button>
												</Box>
											</Tooltip>
										)}
									</>
								)}
							</>
						)}
					</Group>
				</Stack>
			)}
		</Modal>
	);
}
