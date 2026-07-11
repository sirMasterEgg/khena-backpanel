import {
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
import type { Discount, DiscountScope, DiscountType } from "@/data/dummy";
import { computeStatus } from "./format";

const TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
	{ value: "percentage", label: "Percentage" },
	{ value: "fixed", label: "Fixed amount" },
	{ value: "free_shipping", label: "Free shipping" },
];

const SCOPE_OPTIONS: { value: DiscountScope; label: string }[] = [
	{ value: "all", label: "All products" },
	{ value: "collection", label: "Collection" },
	{ value: "category", label: "Category" },
	{ value: "product", label: "Product" },
];

interface DiscountFormProps {
	onSubmit: (discount: Discount) => void;
	onCancel: () => void;
	/** Kalau diisi → mode edit: field terisi awal & tombol Delete muncul. */
	initial?: Discount;
	/** Dipanggil saat tombol Delete ditekan (hanya di mode edit). */
	onDelete?: (discount: Discount) => void;
	/** Label tombol submit (default "Save discount"). */
	submitLabel?: string;
}

/** Isi form modal "Add/Edit discount". State dikelola sendiri. */
function DiscountForm({
	onSubmit,
	onCancel,
	initial,
	onDelete,
	submitLabel = "Save discount",
}: DiscountFormProps) {
	const [code, setCode] = useState(initial?.code ?? "");
	const [type, setType] = useState<DiscountType>(initial?.type ?? "percentage");
	const [value, setValue] = useState<number | string>(initial?.value ?? 0);
	const [scope, setScope] = useState<DiscountScope>(initial?.scope ?? "all");
	const [scopeLabel, setScopeLabel] = useState(initial?.scopeLabel ?? "");
	const [startDate, setStartDate] = useState(initial?.startDate ?? "");
	const [endDate, setEndDate] = useState(initial?.endDate ?? "");
	const [usageLimit, setUsageLimit] = useState<number | string>(
		initial?.usageLimit ?? "",
	);

	const numericValue = typeof value === "number" ? value : Number(value);
	// free_shipping tidak butuh value; tipe lain wajib value > 0.
	const valueOk = type === "free_shipping" || numericValue > 0;
	// endDate harus >= startDate (kalau keduanya terisi).
	const datesOk =
		startDate.length > 0 && endDate.length > 0 && endDate >= startDate;
	const canSubmit = code.trim().length > 0 && valueOk && datesOk;

	const handleSubmit = () => {
		if (!canSubmit) return;
		const limit =
			typeof usageLimit === "number"
				? usageLimit
				: usageLimit.trim().length > 0
					? Number(usageLimit)
					: undefined;
		// Status dihitung otomatis dari rentang tanggal, tidak diinput manual.
		const status = computeStatus(startDate, endDate);
		const discount: Discount = initial
			? {
					// Pertahankan field yang tidak ada di form (id, used).
					...initial,
					code: code.trim().toUpperCase(),
					type,
					value: type === "free_shipping" ? 0 : numericValue,
					scope,
					scopeLabel: scopeLabel.trim() || undefined,
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
					scope,
					scopeLabel: scopeLabel.trim() || undefined,
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
			<TextInput
				label="Code"
				placeholder="e.g. SUMMER10"
				required
				value={code}
				onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
				styles={{ input: { fontFamily: "monospace" } }}
			/>
			<Group grow align="flex-start">
				<Select
					label="Type"
					data={TYPE_OPTIONS}
					value={type}
					onChange={(val) => setType((val as DiscountType) ?? "percentage")}
					allowDeselect={false}
				/>
				{type !== "free_shipping" && (
					<NumberInput
						label={type === "percentage" ? "Value (%)" : "Value (Rp)"}
						placeholder={type === "percentage" ? "10" : "50000"}
						min={0}
						value={value}
						onChange={setValue}
					/>
				)}
			</Group>
			<Group grow align="flex-start">
				<Select
					label="Scope"
					data={SCOPE_OPTIONS}
					value={scope}
					onChange={(val) => setScope((val as DiscountScope) ?? "all")}
					allowDeselect={false}
				/>
				<TextInput
					label="Scope label"
					placeholder="e.g. Modern Living"
					value={scopeLabel}
					onChange={(e) => setScopeLabel(e.currentTarget.value)}
				/>
			</Group>
			<Group grow align="flex-start">
				<DateInput
					label="Start date"
					placeholder="Pick start date"
					valueFormat="DD MMM YYYY"
					required
					value={startDate || null}
					onChange={(val) => setStartDate(val ?? "")}
				/>
				<DateInput
					label="End date"
					placeholder="Pick end date"
					valueFormat="DD MMM YYYY"
					required
					error={datesOk || endDate.length === 0 ? null : "End before start"}
					value={endDate || null}
					onChange={(val) => setEndDate(val ?? "")}
				/>
			</Group>
			<NumberInput
				label="Usage limit"
				description="Kosongkan untuk tak terbatas"
				placeholder="Unlimited"
				min={0}
				value={usageLimit}
				onChange={setUsageLimit}
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
 * Buka modal "Add discount" lewat modals manager (`@mantine/modals`).
 * `onSubmit` dipanggil dengan discount baru sebelum modal ditutup.
 */
export function openAddDiscountModal(onSubmit: (discount: Discount) => void) {
	const id = modals.open({
		title: "Add discount",
		centered: true,
		children: (
			<DiscountForm
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
 * Buka modal "Edit discount" dengan form terisi awal dari `discount`.
 * `onSubmit` menerima discount yang sudah digabung dengan perubahan form,
 * `onDelete` (opsional) dipanggil saat discount dihapus.
 */
export function openEditDiscountModal(
	discount: Discount,
	onSubmit: (updated: Discount) => void,
	onDelete?: (discount: Discount) => void,
) {
	const id = modals.open({
		title: "Edit discount",
		centered: true,
		children: (
			<DiscountForm
				initial={discount}
				submitLabel="Save discount"
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
