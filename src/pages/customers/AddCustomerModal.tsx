import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";
import type { Customer } from "@/data/dummy";

/** Validasi format email sederhana. */
function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface AddCustomerFormProps {
	onSubmit: (customer: Customer) => void;
	onCancel: () => void;
}

/** Isi form modal "Add customer". State dikelola sendiri. */
function AddCustomerForm({ onSubmit, onCancel }: AddCustomerFormProps) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");

	const canSubmit = name.trim().length > 0 && isValidEmail(email.trim());

	const handleSubmit = () => {
		if (!canSubmit) return;
		const customer: Customer = {
			id: Date.now(),
			name: name.trim(),
			email: email.trim(),
			phone: phone.trim() || undefined,
			city: city.trim() || undefined,
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
			/>
			<Group grow align="flex-start">
				<TextInput
					label="Phone"
					placeholder="0812-3456-7890"
					value={phone}
					onChange={(e) => setPhone(e.currentTarget.value)}
				/>
				<TextInput
					label="City"
					placeholder="Jakarta"
					value={city}
					onChange={(e) => setCity(e.currentTarget.value)}
				/>
			</Group>
			<Text size="xs" c="dimmed">
				We'll use this to contact the customer about their orders.
			</Text>

			<Group justify="flex-end" gap="sm">
				<Button variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={!canSubmit}>
					Add customer
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
