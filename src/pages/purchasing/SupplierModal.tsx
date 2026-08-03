import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Center,
	Group,
	Loader,
	Modal,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import {
	createSupplier,
	getSupplier,
	patchSupplier,
	type SupplierInput,
	type SupplierPatchInput,
} from "@/api/suppliers";
import { notify } from "@/components/notify";
import { type SupplierFormData, supplierSchema } from "./supplierSchema";

interface SupplierModalProps {
	opened: boolean;
	/** Ada → mode edit (PATCH), modal fetch detail sendiri. Tidak ada → mode create (POST). */
	supplierId?: string;
	onClose: () => void;
	/** Dipanggil setelah sukses — parent memakai ini untuk invalidate query. */
	onSuccess?: () => void;
}

const emptyToUndefined = (v?: string) => (v?.trim() ? v.trim() : undefined);
const emptyToNull = (v?: string) => (v?.trim() ? v.trim() : null);

export function SupplierModal({
	opened,
	supplierId,
	onClose,
	onSuccess,
}: SupplierModalProps) {
	const isEditing = Boolean(supplierId);

	const detailQuery = useQuery({
		queryKey: ["suppliers", supplierId],
		queryFn: () => getSupplier(supplierId as string),
		enabled: opened && Boolean(supplierId),
	});
	const initial = detailQuery.data;

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<SupplierFormData>({
		resolver: zodResolver(supplierSchema),
		defaultValues: {
			name: "",
			contactPerson: "",
			phone: "",
			email: "",
			note: "",
		},
	});

	useEffect(() => {
		if (!opened) return;
		reset({
			name: initial?.name ?? "",
			contactPerson: initial?.contactPerson ?? "",
			phone: initial?.phone ?? "",
			email: initial?.email ?? "",
			note: initial?.note ?? "",
		});
	}, [opened, initial, reset]);

	const mutation = useMutation({
		mutationFn: (data: SupplierFormData) => {
			if (supplierId) {
				const body: SupplierPatchInput = {
					name: data.name.trim(),
					contactPerson: emptyToNull(data.contactPerson),
					phone: emptyToNull(data.phone),
					email: emptyToNull(data.email),
					note: emptyToNull(data.note),
				};
				return patchSupplier(supplierId, body);
			}
			const body: SupplierInput = {
				name: data.name.trim(),
				contactPerson: emptyToUndefined(data.contactPerson),
				phone: emptyToUndefined(data.phone),
				email: emptyToUndefined(data.email),
				note: emptyToUndefined(data.note),
			};
			return createSupplier(body);
		},
		onSuccess: () => {
			notify.success(isEditing ? "Supplier diperbarui" : "Supplier dibuat");
			onSuccess?.();
			onClose();
		},
		onError: (error) => {
			const fieldErrors = getApiFieldErrors(error);
			if (Object.keys(fieldErrors).length > 0) {
				for (const [field, message] of Object.entries(fieldErrors)) {
					setError(field as keyof SupplierFormData, { message });
				}
				return;
			}
			notify.error(getApiErrorMessage(error));
		},
	});

	const onSubmit = (data: SupplierFormData) => {
		mutation.mutate(data);
	};

	const isLoadingDetail = isEditing && detailQuery.isLoading;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEditing ? "Edit supplier" : "Add supplier"}
			centered
		>
			{isLoadingDetail ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : (
				<form onSubmit={handleSubmit(onSubmit)}>
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
							{...register("note")}
							error={errors.note?.message}
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
								{isEditing ? "Save changes" : "Add supplier"}
							</Button>
						</Group>
					</Stack>
				</form>
			)}
		</Modal>
	);
}
