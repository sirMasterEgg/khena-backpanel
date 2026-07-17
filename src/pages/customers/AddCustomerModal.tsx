import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useForm } from "react-hook-form";
import type { Customer } from "@/data/dummy";
import { type CustomerFormData, customerSchema } from "./customerSchema";

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
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CustomerFormData>({
		resolver: zodResolver(customerSchema),
		defaultValues: {
			name: initial?.name ?? "",
			email: initial?.email ?? "",
			phone: initial?.phone ?? "",
		},
	});

	const submitForm = (data: CustomerFormData) => {
		const customer: Customer = initial
			? {
					// Pertahankan field yang tidak ada di form (id, ordersCount, dst.).
					...initial,
					name: data.name,
					email: data.email,
					phone: data.phone || undefined,
				}
			: {
					id: Date.now(),
					name: data.name,
					email: data.email,
					phone: data.phone || undefined,
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
		<form onSubmit={handleSubmit(submitForm)}>
			<Stack gap="md">
				<TextInput
					label="Full name"
					placeholder="e.g. Andi Wijaya"
					required
					{...register("name")}
					error={errors.name?.message}
				/>
				<TextInput
					label="Email"
					placeholder="e.g. andi@gmail.com"
					required
					type="email"
					{...register("email")}
					error={errors.email?.message}
				/>
				<TextInput
					label="Phone"
					placeholder="0812-3456-7890"
					inputMode="tel"
					{...register("phone")}
					error={errors.phone?.message}
				/>
				<Text size="xs" c="dimmed">
					We'll use this to contact the customer about their orders.
				</Text>

				<Group justify="flex-end" gap="sm">
					<Button variant="default" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit">{submitLabel}</Button>
				</Group>
			</Stack>
		</form>
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
