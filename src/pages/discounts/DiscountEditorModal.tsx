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
import { useState } from "react";
import {
	type Discount,
	type DiscountScope,
	type DiscountStatus,
	type DiscountType,
	dummyCollections,
} from "@/data/dummy";

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
	const [code, setCode] = useState(initial?.code ?? "");
	const [type, setType] = useState<DiscountType>(initial?.type ?? "percentage");
	const [value, setValue] = useState<number | string>(initial?.value ?? 0);
	const [appliesTo, setAppliesTo] = useState<string>(initialAppliesTo(initial));
	const [startDate, setStartDate] = useState(initial?.startDate ?? "");
	const [endDate, setEndDate] = useState(initial?.endDate ?? "");
	const [usageLimit, setUsageLimit] = useState<number | string>(
		initial?.usageLimit ?? "",
	);
	const [status, setStatus] = useState<DiscountStatus>(
		initial?.status ?? "active",
	);

	// Cukup: code & endDate terisi.
	const canSubmit = code.trim().length > 0 && endDate.length > 0;

	const handleSubmit = () => {
		if (!canSubmit) return;
		const numericValue = typeof value === "number" ? value : Number(value);
		const limit =
			typeof usageLimit === "number"
				? usageLimit
				: usageLimit.trim().length > 0
					? Number(usageLimit)
					: undefined;
		// Terjemahkan opsi "Applies to" ke scope + scopeLabel.
		const applies =
			appliesToOptions.find((o) => o.value === appliesTo) ??
			appliesToOptions[0];
		const discount: Discount = initial
			? {
					// Pertahankan field yang tidak ada di form (id, used).
					...initial,
					code: code.trim().toUpperCase(),
					type,
					value: type === "free_shipping" ? 0 : numericValue,
					scope: applies.scope,
					scopeLabel: applies.label,
					startDate,
					endDate,
					usageLimit: limit,
					status,
				}
			: {
					id: Date.now(),
					code: code.trim().toUpperCase(),
					type,
					value: type === "free_shipping" ? 0 : numericValue,
					scope: applies.scope,
					scopeLabel: applies.label,
					startDate,
					endDate,
					used: 0,
					usageLimit: limit,
					status,
				};
		onSubmit(discount);
	};

	return (
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
				<TextInput
					label="Discount code"
					required
					placeholder="e.g. WELCOME10"
					description="Pelanggan memasukkan kode ini saat checkout. Huruf besar & tanpa spasi."
					value={code}
					onChange={(e) =>
						setCode(e.currentTarget.value.toUpperCase().replace(/\s+/g, ""))
					}
					styles={{ input: { fontFamily: "monospace" } }}
				/>
			</Box>

			<Group grow align="flex-start">
				<Select
					label="Type"
					data={TYPE_OPTIONS}
					value={type}
					onChange={(val) => setType((val as DiscountType) ?? "percentage")}
					allowDeselect={false}
				/>
				{type === "free_shipping" ? (
					<TextInput label="Value" value="Free shipping" disabled />
				) : (
					<NumberInput
						label={type === "percentage" ? "Value (%)" : "Value (Rp)"}
						placeholder={type === "percentage" ? "10" : "50000"}
						min={0}
						value={value}
						onChange={setValue}
					/>
				)}
			</Group>

			<Select
				label="Applies to"
				data={appliesToOptions.map((o) => ({ value: o.value, label: o.label }))}
				value={appliesTo}
				onChange={(val) => setAppliesTo(val ?? "all")}
				allowDeselect={false}
			/>

			<Group grow align="flex-start">
				<DateInput
					label="Start date"
					placeholder="Pick start date"
					valueFormat="DD MMM YYYY"
					value={startDate || null}
					onChange={(val) => setStartDate(val ?? "")}
				/>
				<DateInput
					label="End date"
					placeholder="Pick end date"
					valueFormat="DD MMM YYYY"
					required
					value={endDate || null}
					onChange={(val) => setEndDate(val ?? "")}
				/>
			</Group>

			<Group grow align="flex-start">
				<NumberInput
					label="Usage limit"
					description="Kosongkan untuk tanpa batas"
					// Taruh deskripsi di bawah input supaya field sejajar dengan Status.
					inputWrapperOrder={["label", "input", "description"]}
					placeholder="No limit"
					min={0}
					value={usageLimit}
					onChange={setUsageLimit}
				/>
				<Select
					label="Status"
					data={STATUS_OPTIONS}
					value={status}
					onChange={(val) => setStatus((val as DiscountStatus) ?? "active")}
					allowDeselect={false}
				/>
			</Group>

			<Group justify="flex-end" gap="sm">
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
