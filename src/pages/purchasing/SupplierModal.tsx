import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";
import type { Supplier } from "@/data/dummy";

/** Validasi format email sederhana. */
function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface SupplierFormProps {
	onSubmit: (supplier: Supplier) => void;
	onCancel: () => void;
	/** Kalau diisi → mode edit: field terisi awal & tombol Delete muncul. */
	initial?: Supplier;
	/** Dipanggil saat tombol Delete ditekan (hanya di mode edit). */
	onDelete?: (supplier: Supplier) => void;
	/** Label tombol submit (default "Save supplier"). */
	submitLabel?: string;
}

/** Isi form modal "Add/Edit supplier". State dikelola sendiri. */
function SupplierForm({
	onSubmit,
	onCancel,
	initial,
	onDelete,
	submitLabel = "Save supplier",
}: SupplierFormProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [contactPerson, setContactPerson] = useState(
		initial?.contactPerson ?? "",
	);
	const [phone, setPhone] = useState(initial?.phone ?? "");
	const [email, setEmail] = useState(initial?.email ?? "");
	const [notes, setNotes] = useState(initial?.notes ?? "");

	// Nama wajib; kalau email diisi, formatnya harus valid.
	const emailOk = email.trim().length === 0 || isValidEmail(email.trim());
	const canSubmit = name.trim().length > 0 && emailOk;

	const handleSubmit = () => {
		if (!canSubmit) return;
		const supplier: Supplier = initial
			? {
					// Pertahankan field yang tidak ada di form (id).
					...initial,
					name: name.trim(),
					contactPerson: contactPerson.trim() || undefined,
					phone: phone.trim() || undefined,
					email: email.trim() || undefined,
					notes: notes.trim() || undefined,
				}
			: {
					id: Date.now(),
					name: name.trim(),
					contactPerson: contactPerson.trim() || undefined,
					phone: phone.trim() || undefined,
					email: email.trim() || undefined,
					notes: notes.trim() || undefined,
				};
		onSubmit(supplier);
	};

	return (
		<Stack gap="md">
			<TextInput
				label="Supplier name"
				placeholder="e.g. Jati Makmur Furniture"
				required
				value={name}
				onChange={(e) => setName(e.currentTarget.value)}
			/>
			<Group grow align="flex-start">
				<TextInput
					label="Contact person"
					placeholder="e.g. Bambang Sutrisno"
					value={contactPerson}
					onChange={(e) => setContactPerson(e.currentTarget.value)}
				/>
				<TextInput
					label="Phone"
					placeholder="0812-3456-7890"
					value={phone}
					onChange={(e) => setPhone(e.currentTarget.value)}
				/>
			</Group>
			<TextInput
				label="Email"
				placeholder="e.g. sales@supplier.com"
				type="email"
				error={
					email.trim().length > 0 && !emailOk ? "Invalid email format" : null
				}
				value={email}
				onChange={(e) => setEmail(e.currentTarget.value)}
			/>
			<Textarea
				label="Notes"
				placeholder="Catatan internal (lead time, minimum order, dsb.)"
				autosize
				minRows={2}
				value={notes}
				onChange={(e) => setNotes(e.currentTarget.value)}
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
 * Buka modal "Add supplier" lewat modals manager (`@mantine/modals`).
 * `onSubmit` dipanggil dengan supplier baru sebelum modal ditutup.
 */
export function openAddSupplierModal(onSubmit: (supplier: Supplier) => void) {
	const id = modals.open({
		title: "Add supplier",
		centered: true,
		children: (
			<SupplierForm
				onSubmit={(supplier) => {
					onSubmit(supplier);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}

/**
 * Buka modal "Edit supplier" dengan form terisi awal dari `supplier`.
 * `onSubmit` menerima supplier yang sudah digabung dengan perubahan form,
 * `onDelete` (opsional) dipanggil saat supplier dihapus.
 */
export function openEditSupplierModal(
	supplier: Supplier,
	onSubmit: (updated: Supplier) => void,
	onDelete?: (supplier: Supplier) => void,
) {
	const id = modals.open({
		title: "Edit supplier",
		centered: true,
		children: (
			<SupplierForm
				initial={supplier}
				submitLabel="Save supplier"
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
