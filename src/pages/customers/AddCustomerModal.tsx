import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";
import type { Customer } from "@/data/dummy";
import { isValidEmail, isValidPhone } from "@/lib/validation";

interface AddCustomerFormProps {
	onSubmit: (customer: Customer) => void;
	onCancel: () => void;
	/** Kalau diisi → mode edit: field terisi awal & field non-form dipertahankan. */
	initial?: Customer;
	/** Label tombol submit (default "Add customer"). */
	submitLabel?: string;
}

/** Isi form modal "Add/Edit customer". State dikelola sendiri. */
function AddCustomerForm({
	onSubmit,
	onCancel,
	initial,
	submitLabel = "Add customer",
}: AddCustomerFormProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [email, setEmail] = useState(initial?.email ?? "");
	const [phone, setPhone] = useState(initial?.phone ?? "");

	// Phone opsional, tapi kalau diisi harus format nomor HP yang valid.
	const phoneError =
		phone.trim().length > 0 && !isValidPhone(phone.trim())
			? "Masukkan nomor HP yang valid"
			: null;
	const emailError =
		email.trim().length > 0 && !isValidEmail(email.trim())
			? "Masukkan email yang valid"
			: null;

	const canSubmit =
		name.trim().length > 0 && isValidEmail(email.trim()) && !phoneError;

	const handleSubmit = () => {
		if (!canSubmit) return;
		const customer: Customer = initial
			? {
					// Pertahankan field yang tidak ada di form (id, ordersCount, dst.).
					...initial,
					name: name.trim(),
					email: email.trim(),
					phone: phone.trim() || undefined,
				}
			: {
					id: Date.now(),
					name: name.trim(),
					email: email.trim(),
					phone: phone.trim() || undefined,
					avatarColor: "teal",
					ordersCount: 0,
					lifetimeValue: 0,
					lastOrderAt: null,
					joinedAt: new Date().toISOString().slice(0, 10),
					segment: "new",
				};
		onSubmit(customer);
	};

	return (
		<Stack gap="md">
			<TextInput
				label="Full name"
				placeholder="e.g. Andi Wijaya"
				required
				value={name}
				onChange={(e) => setName(e.currentTarget.value)}
			/>
			<TextInput
				label="Email"
				placeholder="e.g. andi@gmail.com"
				required
				type="email"
				value={email}
				onChange={(e) => setEmail(e.currentTarget.value)}
				error={emailError}
			/>
			<TextInput
				label="Phone"
				placeholder="0812-3456-7890"
				inputMode="tel"
				value={phone}
				onChange={(e) => setPhone(e.currentTarget.value)}
				error={phoneError}
			/>
			<Text size="xs" c="dimmed">
				We'll use this to contact the customer about their orders.
			</Text>

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
 * Buka modal "Add customer" lewat modals manager (`@mantine/modals`).
 * `onSubmit` dipanggil dengan customer baru sebelum modal ditutup.
 */
export function openAddCustomerModal(onSubmit: (customer: Customer) => void) {
	const id = modals.open({
		title: "Add customer",
		centered: true,
		children: (
			<AddCustomerForm
				onSubmit={(customer) => {
					onSubmit(customer);
					modals.close(id);
				}}
				onCancel={() => modals.close(id)}
			/>
		),
	});
}

/**
 * Buka modal "Edit customer" dengan form terisi awal dari `customer`.
 * `onSubmit` menerima customer yang sudah digabung dengan perubahan form.
 */
export function openEditCustomerModal(
	customer: Customer,
	onSubmit: (updated: Customer) => void,
) {
	const id = modals.open({
		title: "Edit customer",
		centered: true,
		children: (
			<AddCustomerForm
				initial={customer}
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
