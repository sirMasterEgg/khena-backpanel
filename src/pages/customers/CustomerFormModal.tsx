import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import { type Customer, createCustomer, patchCustomer } from "@/api/customers";
import { notify } from "@/components/notify";
import {
	type CustomerFormData,
	customerFormSchema,
} from "./customerFormSchema";

interface CustomerFormModalProps {
	opened: boolean;
	/** Ada → mode edit (PATCH). Tidak ada → mode create (POST). */
	initial?: { id: string; name: string; email: string; phone: string };
	onClose: () => void;
	/** Dipanggil setelah sukses, membawa customer hasil POST/PATCH. */
	onSuccess?: (customer: Customer) => void;
}

export function CustomerFormModal({
	opened,
	initial,
	onClose,
	onSuccess,
}: CustomerFormModalProps) {
	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<CustomerFormData>({
		resolver: zodResolver(customerFormSchema),
		defaultValues: { name: "", email: "", phone: "" },
	});

	const isEditing = Boolean(initial);

	useEffect(() => {
		if (!opened) return;
		reset({
			name: initial?.name ?? "",
			email: initial?.email ?? "",
			phone: initial?.phone ?? "",
		});
	}, [opened, initial, reset]);

	const mutation = useMutation({
		mutationFn: (body: CustomerFormData) =>
			initial ? patchCustomer(initial.id, body) : createCustomer(body),
		onSuccess: (customer) => {
			notify.success(isEditing ? "Customer diperbarui" : "Customer dibuat");
			onSuccess?.(customer);
			onClose();
		},
		onError: (error) => {
			const fieldErrors = getApiFieldErrors(error);
			if (Object.keys(fieldErrors).length > 0) {
				for (const [field, message] of Object.entries(fieldErrors)) {
					setError(field as keyof CustomerFormData, { message });
				}
				return;
			}
			// Error duplikat datang sebagai HTTP 400 (bukan 422 field error) —
			// petakan ke field yang relevan supaya lebih enak dipakai daripada toast.
			const message = getApiErrorMessage(error);
			if (message.includes("email already exists")) {
				setError("email", { message: "Email sudah digunakan" });
				return;
			}
			if (message.includes("phone already exists")) {
				setError("phone", { message: "Nomor HP sudah digunakan" });
				return;
			}
			notify.error(message);
		},
	});

	const onSubmit = (data: CustomerFormData) => {
		mutation.mutate(data);
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEditing ? "Edit customer" : "Add customer"}
			centered
		>
			<form onSubmit={handleSubmit(onSubmit)}>
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
						required
						inputMode="tel"
						{...register("phone")}
						error={errors.phone?.message}
					/>

					<Group justify="flex-end" gap="sm">
						<Button type="button" variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							loading={mutation.isPending}
							disabled={mutation.isPending}
						>
							{isEditing ? "Save changes" : "Add customer"}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
