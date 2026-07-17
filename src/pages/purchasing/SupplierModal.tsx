import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useForm } from "react-hook-form";
import type { Supplier } from "@/data/dummy";
import { type SupplierFormData, supplierSchema } from "./supplierSchema";

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
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SupplierFormData>({
		resolver: zodResolver(supplierSchema),
		defaultValues: {
			name: initial?.name ?? "",
			contactPerson: initial?.contactPerson ?? "",
			phone: initial?.phone ?? "",
			email: initial?.email ?? "",
			notes: initial?.notes ?? "",
		},
	});

	const submitForm = (data: SupplierFormData) => {
		const supplier: Supplier = initial
			? {
					// Pertahankan field yang tidak ada di form (id).
					...initial,
					name: data.name,
					contactPerson: data.contactPerson || undefined,
					phone: data.phone || undefined,
					email: data.email || undefined,
					notes: data.notes || undefined,
				}
			: {
					id: Date.now(),
					name: data.name,
					contactPerson: data.contactPerson || undefined,
					phone: data.phone || undefined,
					email: data.email || undefined,
					notes: data.notes || undefined,
				};
		onSubmit(supplier);
	};

	return (
		<form onSubmit={handleSubmit(submitForm)}>
			<Stack gap="md">
				<TextInput
					label="Supplier name"
					placeholder="e.g. Jati Makmur Furniture"
					required
					{...register("name")}
					error={errors.name?.message}
				/>
				<Group grow align="flex-start">
					<TextInput
						label="Contact person"
						placeholder="e.g. Bambang Sutrisno"
						{...register("contactPerson")}
						error={errors.contactPerson?.message}
					/>
					<TextInput
						label="Phone"
						placeholder="0812-3456-7890"
						{...register("phone")}
						error={errors.phone?.message}
					/>
				</Group>
				<TextInput
					label="Email"
					placeholder="e.g. sales@supplier.com"
					type="email"
					{...register("email")}
					error={errors.email?.message}
				/>
				<Textarea
					label="Notes"
					placeholder="Catatan internal (lead time, minimum order, dsb.)"
					autosize
					minRows={2}
					{...register("notes")}
					error={errors.notes?.message}
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
					<Button type="submit">{submitLabel}</Button>
				</Group>
			</Stack>
		</form>
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
