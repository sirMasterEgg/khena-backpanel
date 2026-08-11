import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Button,
	Group,
	Modal,
	NumberInput,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import { logMarketplaceOrder } from "@/api/marketplace";
import { listPosVariants } from "@/api/pointOfSales";
import { notify } from "@/components/notify";
import { formatIDR } from "@/utils/format";
import { type LogOrderFormData, logOrderSchema } from "./logOrderSchema";
import { CHANNEL_META, MARKETPLACE_CHANNELS } from "./marketplaceChannels";

interface LogOrderModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

const CHANNEL_OPTIONS = MARKETPLACE_CHANNELS.map((ch) => ({
	value: ch,
	label: CHANNEL_META[ch].label,
}));

const emptyFormValues: LogOrderFormData = {
	marketplace: "tokopedia",
	date: "",
	orderId: "",
	buyerName: "",
	items: [],
};

export function LogOrderModal({
	opened,
	onClose,
	onSuccess,
}: LogOrderModalProps) {
	const queryClient = useQueryClient();

	const {
		control,
		register,
		handleSubmit,
		reset,
		setError,
		watch,
		formState: { errors },
	} = useForm<LogOrderFormData>({
		resolver: zodResolver(logOrderSchema),
		defaultValues: emptyFormValues,
	});
	const { fields, append, remove } = useFieldArray({ control, name: "items" });
	const items = watch("items");

	// ----- Picker SKU -----
	const [selectedSku, setSelectedSku] = useState<string | null>(null);
	const [skuSearch, setSkuSearch] = useState("");
	const [debouncedSkuSearch] = useDebouncedValue(skuSearch, 300);

	const variantsQuery = useQuery({
		queryKey: ["pos", "variants", { sku: debouncedSkuSearch }],
		queryFn: () =>
			listPosVariants({ sku: debouncedSkuSearch || undefined, limit: 20 }),
		enabled: opened,
	});
	const variantOptions = (variantsQuery.data?.data ?? [])
		.filter((v) => !items.some((it) => it.variantSku === v.sku))
		.map((v) => ({ value: v.sku, label: `${v.sku} — ${v.variantName}` }));

	const resetPicker = () => {
		setSelectedSku(null);
		setSkuSearch("");
	};

	const addItem = () => {
		const variant = variantsQuery.data?.data.find((v) => v.sku === selectedSku);
		if (!variant) return;
		append({
			variantSku: variant.sku,
			productName: variant.variantName,
			quantity: 1,
			revenue: 0,
		});
		resetPicker();
	};

	const total = items.reduce((sum, i) => sum + i.revenue, 0);

	const mutation = useMutation({
		mutationFn: logMarketplaceOrder,
		onSuccess: () => {
			notify.success("Marketplace order logged");
			queryClient.invalidateQueries({ queryKey: ["marketplace"] });
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
			onSuccess?.();
			onClose();
		},
		onError: (err) => {
			// 422 → taruh error di field yang tepat; selain itu toast.
			const fieldErrors = getApiFieldErrors(err);
			const entries = Object.entries(fieldErrors);
			if (entries.length > 0) {
				for (const [field, message] of entries) {
					setError(field as keyof LogOrderFormData, { message });
				}
				return;
			}
			notify.error(getApiErrorMessage(err));
		},
	});

	const onSubmit = (data: LogOrderFormData) =>
		mutation.mutate({
			marketplace: data.marketplace,
			date: data.date,
			orderId: data.orderId.trim(),
			buyerName: data.buyerName.trim(),
			// productName hanya untuk tampilan — JANGAN ikut dikirim.
			items: data.items.map((i) => ({
				variantSku: i.variantSku,
				quantity: i.quantity,
				revenue: i.revenue,
			})),
		});

	// Reset form SETELAH animasi tutup selesai supaya isi modal tidak
	// berkedip kosong saat masih terlihat (pola ImportStockCsvModal.tsx).
	const handleExited = () => {
		reset(emptyFormValues);
		resetPicker();
		mutation.reset();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			onExitTransitionEnd={handleExited}
			title="Log marketplace order"
			centered
			size="lg"
		>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack gap="md">
					<Group grow align="flex-start">
						<Controller
							name="marketplace"
							control={control}
							render={({ field }) => (
								<Select
									label="Marketplace"
									data={CHANNEL_OPTIONS}
									value={field.value}
									onChange={(val) => field.onChange(val ?? "tokopedia")}
									allowDeselect={false}
									error={errors.marketplace?.message}
								/>
							)}
						/>
						<Controller
							name="date"
							control={control}
							render={({ field }) => (
								<DateInput
									label="Date"
									placeholder="Pick a date"
									valueFormat="DD MMM YYYY"
									required
									value={field.value || null}
									onChange={(val) => field.onChange(val ?? "")}
									error={errors.date?.message}
								/>
							)}
						/>
					</Group>

					<Group grow align="flex-start">
						<TextInput
							label="Order ID"
							placeholder="SHP-2026-0001"
							required
							{...register("orderId")}
							error={errors.orderId?.message}
						/>
						<TextInput
							label="Buyer name"
							required
							{...register("buyerName")}
							error={errors.buyerName?.message}
						/>
					</Group>

					<Stack gap="xs">
						<Text fw={500} size="sm">
							Add item
						</Text>
						<Group align="flex-end" gap="sm">
							<Select
								label="SKU"
								placeholder="Cari SKU…"
								searchable
								flex={1}
								data={variantOptions}
								value={selectedSku}
								searchValue={skuSearch}
								onSearchChange={setSkuSearch}
								onChange={setSelectedSku}
							/>
							<Button
								type="button"
								variant="light"
								leftSection={<IconPlus size={16} />}
								disabled={!selectedSku}
								onClick={addItem}
							>
								Add item
							</Button>
						</Group>
					</Stack>

					<Stack gap="xs">
						<Table verticalSpacing="sm">
							<Table.Thead>
								<Table.Tr>
									<Table.Th>SKU / Product</Table.Th>
									<Table.Th style={{ width: 90 }}>Qty</Table.Th>
									<Table.Th style={{ width: 160 }}>Revenue</Table.Th>
									<Table.Th style={{ width: 40 }} />
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{fields.length === 0 ? (
									<Table.Tr>
										<Table.Td colSpan={4}>
											<Text c="dimmed" size="sm">
												No items yet — add a SKU above.
											</Text>
										</Table.Td>
									</Table.Tr>
								) : (
									fields.map((field, index) => (
										<Table.Tr key={field.id}>
											<Table.Td>
												<Stack gap={0}>
													<Text size="sm" ff="monospace">
														{field.variantSku}
													</Text>
													<Text size="xs" c="dimmed">
														{field.productName}
													</Text>
												</Stack>
											</Table.Td>
											<Table.Td>
												<Controller
													name={`items.${index}.quantity`}
													control={control}
													render={({ field: f }) => (
														<NumberInput
															min={1}
															allowDecimal={false}
															value={f.value}
															onChange={(val) =>
																f.onChange(typeof val === "number" ? val : 1)
															}
														/>
													)}
												/>
											</Table.Td>
											<Table.Td>
												<Controller
													name={`items.${index}.revenue`}
													control={control}
													render={({ field: f }) => (
														<NumberInput
															min={0}
															allowDecimal={false}
															thousandSeparator="."
															description="Total for this item, not unit price"
															value={f.value}
															onChange={(val) =>
																f.onChange(typeof val === "number" ? val : 0)
															}
															error={errors.items?.[index]?.revenue?.message}
														/>
													)}
												/>
											</Table.Td>
											<Table.Td>
												<ActionIcon
													type="button"
													variant="subtle"
													color="red"
													onClick={() => remove(index)}
													aria-label="Remove item"
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									))
								)}
							</Table.Tbody>
						</Table>
						{errors.items?.message && (
							<Text c="red" size="sm">
								{errors.items.message}
							</Text>
						)}
					</Stack>

					<Group justify="flex-end" gap="sm">
						<Text c="dimmed">Total</Text>
						<Text fw={700}>{formatIDR(total)}</Text>
					</Group>

					<Group justify="flex-end" gap="sm">
						<Button type="button" variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							loading={mutation.isPending}
							disabled={mutation.isPending}
						>
							Log order
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
