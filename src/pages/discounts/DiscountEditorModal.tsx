import { zodResolver } from "@hookform/resolvers/zod";
import {
	Box,
	Button,
	Group,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { Controller, useForm } from "react-hook-form";
import {
	type Discount,
	type DiscountScope,
	type DiscountStatus,
	type DiscountType,
	dummyCollections,
} from "@/data/dummy";
import { type DiscountFormData, discountSchema } from "./discountSchema";

const TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
	{ value: "percentage", label: "Percentage off" },
	{ value: "fixed", label: "Fixed amount off" },
	{ value: "free_shipping", label: "Free shipping" },
];

const STATUS_OPTIONS: { value: DiscountStatus; label: string }[] = [
	{ value: "active", label: "Active" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "expired", label: "Expired" },
];

/**
 * Opsi "Applies to": beberapa opsi statis + daftar collection dinamis.
 * Tiap opsi menyimpan `scope` + `label` supaya bisa mengisi kedua field
 * `scope` & `scopeLabel` di tipe `Discount` saat submit. `value` dibikin unik
 * untuk dipakai `<Select/>`.
 */
const appliesToOptions: {
	value: string;
	scope: DiscountScope;
	label: string;
}[] = [
	{ value: "all", scope: "all", label: "All products" },
	{ value: "vip", scope: "all", label: "VIP customers" },
	{ value: "newsletter", scope: "all", label: "Newsletter subscribers" },
	{ value: "orders-10m", scope: "all", label: "Orders > Rp 10.000.000" },
	...dummyCollections.map((c) => ({
		value: `collection-${c.id}`,
		scope: "collection" as DiscountScope,
		label: c.name,
	})),
];

/** Cari value opsi "Applies to" awal dari `scopeLabel` (fallback "all"). */
function initialAppliesTo(initial?: Discount): string {
	if (!initial) return "all";
	const match = appliesToOptions.find((o) => o.label === initial.scopeLabel);
	return match?.value ?? "all";
}

interface DiscountFormProps {
	onSubmit: (discount: Discount) => void;
	onCancel: () => void;
	/** Kalau diisi → mode edit: field terisi awal. */
	initial?: Discount;
	/** Label tombol submit (default "Create discount"). */
	submitLabel?: string;
}

/** Isi form modal "New/Edit Discount". State dikelola sendiri. */
function DiscountForm({
	onSubmit,
	onCancel,
	initial,
	submitLabel = "Create discount",
}: DiscountFormProps) {
	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<DiscountFormData>({
		resolver: zodResolver(discountSchema),
		defaultValues: {
			code: initial?.code ?? "",
			type: initial?.type ?? "percentage",
			value: initial?.value ?? 0,
			appliesTo: initialAppliesTo(initial),
			startDate: initial?.startDate ?? "",
			endDate: initial?.endDate ?? "",
			usageLimit: initial?.usageLimit,
			status: initial?.status ?? "active",
		},
	});

	// Field Value disembunyikan saat free shipping.
	const type = watch("type");

	const submitForm = (data: DiscountFormData) => {
		// Terjemahkan opsi "Applies to" ke scope + scopeLabel.
		const applies =
			appliesToOptions.find((o) => o.value === data.appliesTo) ??
			appliesToOptions[0];
		const base = {
			code: data.code.trim().toUpperCase(),
			type: data.type,
			value: data.type === "free_shipping" ? 0 : data.value,
			scope: applies.scope,
			scopeLabel: applies.label,
			startDate: data.startDate,
			endDate: data.endDate,
			usageLimit: data.usageLimit,
			status: data.status,
		};
		const discount: Discount = initial
			? // Pertahankan field yang tidak ada di form (id, used).
				{ ...initial, ...base }
			: { id: Date.now(), used: 0, ...base };
		onSubmit(discount);
	};

	return (
		<form onSubmit={handleSubmit(submitForm)}>
			<Stack gap="md">
				{/* Field kode dibungkus kotak highlight supaya menonjol. */}
				<Box
					p="md"
					style={{
						background: "var(--mantine-color-blue-light)",
						border: "1px solid var(--mantine-color-blue-light-hover)",
						borderRadius: "var(--mantine-radius-md)",
					}}
				>
					<Controller
						name="code"
						control={control}
						render={({ field }) => (
							<TextInput
								label="Discount code"
								required
								placeholder="e.g. WELCOME10"
								description="Pelanggan memasukkan kode ini saat checkout. Huruf besar & tanpa spasi."
								value={field.value}
								onChange={(e) =>
									field.onChange(
										e.currentTarget.value.toUpperCase().replace(/\s+/g, ""),
									)
								}
								error={errors.code?.message}
								styles={{ input: { fontFamily: "monospace" } }}
							/>
						)}
					/>
				</Box>

				<Group grow align="flex-start">
					<Controller
						name="type"
						control={control}
						render={({ field }) => (
							<Select
								label="Type"
								data={TYPE_OPTIONS}
								value={field.value}
								onChange={(val) =>
									field.onChange((val as DiscountType) ?? "percentage")
								}
								allowDeselect={false}
							/>
						)}
					/>
					{type === "free_shipping" ? (
						<TextInput label="Value" value="Free shipping" disabled />
					) : (
						<Controller
							name="value"
							control={control}
							render={({ field }) => (
								<NumberInput
									label={type === "percentage" ? "Value (%)" : "Value (Rp)"}
									placeholder={type === "percentage" ? "10" : "50000"}
									min={0}
									value={field.value}
									onChange={(val) =>
										field.onChange(typeof val === "number" ? val : 0)
									}
									error={errors.value?.message}
								/>
							)}
						/>
					)}
				</Group>

				<Controller
					name="appliesTo"
					control={control}
					render={({ field }) => (
						<Select
							label="Applies to"
							data={appliesToOptions.map((o) => ({
								value: o.value,
								label: o.label,
							}))}
							value={field.value}
							onChange={(val) => field.onChange(val ?? "all")}
							allowDeselect={false}
						/>
					)}
				/>

				<Group grow align="flex-start">
					<Controller
						name="startDate"
						control={control}
						render={({ field }) => (
							<DateInput
								label="Start date"
								placeholder="Pick start date"
								valueFormat="DD MMM YYYY"
								value={field.value || null}
								onChange={(val) => field.onChange(val ?? "")}
							/>
						)}
					/>
					<Controller
						name="endDate"
						control={control}
						render={({ field }) => (
							<DateInput
								label="End date"
								placeholder="Pick end date"
								valueFormat="DD MMM YYYY"
								required
								value={field.value || null}
								onChange={(val) => field.onChange(val ?? "")}
								error={errors.endDate?.message}
							/>
						)}
					/>
				</Group>

				<Group grow align="flex-start">
					<Controller
						name="usageLimit"
						control={control}
						render={({ field }) => (
							<NumberInput
								label="Usage limit"
								description="Kosongkan untuk tanpa batas"
								// Taruh deskripsi di bawah input supaya field sejajar dengan Status.
								inputWrapperOrder={["label", "input", "description"]}
								placeholder="No limit"
								min={0}
								value={field.value ?? ""}
								onChange={(val) =>
									field.onChange(typeof val === "number" ? val : undefined)
								}
								error={errors.usageLimit?.message}
							/>
						)}
					/>
					<Controller
						name="status"
						control={control}
						render={({ field }) => (
							<Select
								label="Status"
								data={STATUS_OPTIONS}
								value={field.value}
								onChange={(val) =>
									field.onChange((val as DiscountStatus) ?? "active")
								}
								allowDeselect={false}
							/>
						)}
					/>
				</Group>

				<Group justify="flex-end" gap="sm">
					<Button type="button" variant="default" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit">{submitLabel}</Button>
				</Group>
			</Stack>
		</form>
	);
}

/**
 * Buka modal "New Discount" lewat modals manager (`@mantine/modals`).
 * `onSubmit` dipanggil dengan discount baru sebelum modal ditutup.
 */
export function openAddDiscountModal(onSubmit: (discount: Discount) => void) {
	const id = modals.open({
		title: "New Discount",
		centered: true,
		children: (
			<DiscountForm
				submitLabel="Create discount"
				onSubmit={(discount) => {
					onSubmit(discount);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}

/**
 * Buka modal "Edit Discount" dengan form terisi awal dari `discount`.
 * `onSubmit` menerima discount yang sudah digabung dengan perubahan form.
 */
export function openEditDiscountModal(
	discount: Discount,
	onSubmit: (updated: Discount) => void,
) {
	const id = modals.open({
		title: "Edit Discount",
		centered: true,
		children: (
			<DiscountForm
				initial={discount}
				submitLabel="Save changes"
				onSubmit={(updated) => {
					onSubmit(updated);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}
