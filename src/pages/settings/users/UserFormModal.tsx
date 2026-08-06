import { zodResolver } from "@hookform/resolvers/zod";
import {
	Alert,
	Button,
	Center,
	Group,
	Loader,
	Modal,
	PasswordInput,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type AdministratorPatchInput,
	createAdministrator,
	getAdministrator,
	patchAdministrator,
} from "@/api/administrators";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import { listRoles } from "@/api/roles";
import { notify } from "@/components/notify";
import { makeUserFormSchema, type UserFormData } from "./userFormSchema";

interface UserFormModalProps {
	opened: boolean;
	/** Ada → mode edit (fetch GET /administrators/:id lalu PATCH). Tidak ada → mode create (POST). */
	administratorId?: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const emptyFormValues: UserFormData = {
	name: "",
	email: "",
	roleId: "",
	password: "",
};

export function UserFormModal({
	opened,
	administratorId,
	onClose,
	onSuccess,
}: UserFormModalProps) {
	const isEditing = Boolean(administratorId);

	const detailQuery = useQuery({
		queryKey: ["administrators", administratorId],
		queryFn: () => getAdministrator(administratorId as string),
		enabled: opened && Boolean(administratorId),
	});
	const initial = detailQuery.data;

	const rolesQuery = useQuery({
		queryKey: ["roles", { limit: 100 }],
		queryFn: () => listRoles({ limit: 100 }),
		enabled: opened,
	});
	const roleOptions = (rolesQuery.data?.data ?? []).map((r) => ({
		value: r.id,
		label: r.name,
	}));

	const {
		control,
		handleSubmit,
		reset,
		setError,
		watch,
		formState: { errors },
	} = useForm<UserFormData>({
		resolver: zodResolver(makeUserFormSchema(isEditing)),
		defaultValues: emptyFormValues,
	});

	useEffect(() => {
		if (!opened) {
			reset(emptyFormValues);
			return;
		}
		if (initial) {
			reset({
				name: initial.name,
				email: initial.email,
				roleId: initial.role?.id ?? "",
				password: "",
			});
		} else if (!administratorId) {
			reset(emptyFormValues);
		}
	}, [opened, initial, administratorId, reset]);

	const password = watch("password");

	const mutation = useMutation({
		mutationFn: (data: UserFormData) => {
			if (administratorId) {
				const body: AdministratorPatchInput = {
					name: data.name.trim(),
					email: data.email.trim(),
					roleId: data.roleId,
				};
				if (data.password) body.password = data.password;
				return patchAdministrator(administratorId, body);
			}
			return createAdministrator({
				name: data.name.trim(),
				email: data.email.trim(),
				roleId: data.roleId,
				password: data.password,
			});
		},
		onSuccess: () => {
			notify.success(isEditing ? "User updated" : "User created");
			onSuccess?.();
			onClose();
		},
		onError: (error) => {
			const fieldErrors = getApiFieldErrors(error);
			if (Object.keys(fieldErrors).length > 0) {
				for (const [field, message] of Object.entries(fieldErrors)) {
					setError(field as keyof UserFormData, { message });
				}
				return;
			}
			const message = getApiErrorMessage(error);
			if (message.toLowerCase().includes("email already exists")) {
				setError("email", {
					message: "Email is already used by another administrator",
				});
				return;
			}
			notify.error(message);
		},
	});

	const onSubmit = (data: UserFormData) => {
		mutation.mutate(data);
	};

	const isLoadingDetail = isEditing && detailQuery.isLoading;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEditing ? "Edit User" : "New User"}
			centered
		>
			{isLoadingDetail ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : (
				<form onSubmit={handleSubmit(onSubmit)}>
					<Stack gap="md">
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<TextInput
									label="Name"
									required
									placeholder="e.g. Budi Santoso"
									{...field}
									error={errors.name?.message}
								/>
							)}
						/>

						<Controller
							name="email"
							control={control}
							render={({ field }) => (
								<TextInput
									label="Email"
									required
									placeholder="e.g. budi@khena.local"
									{...field}
									error={errors.email?.message}
								/>
							)}
						/>

						<Controller
							name="roleId"
							control={control}
							render={({ field }) => (
								<Select
									label="Role"
									required
									placeholder="Select role"
									data={roleOptions}
									value={field.value || null}
									onChange={(val) => field.onChange(val ?? "")}
									error={errors.roleId?.message}
									searchable
								/>
							)}
						/>

						<Controller
							name="password"
							control={control}
							render={({ field }) => (
								<PasswordInput
									label={isEditing ? "New password" : "Password"}
									required={!isEditing}
									placeholder={isEditing ? undefined : "Minimal 8 karakter"}
									description={
										isEditing
											? "Kosongkan jika tidak ingin mengubah password."
											: "Minimal 8 karakter"
									}
									{...field}
									error={errors.password?.message}
								/>
							)}
						/>

						{isEditing && password.length > 0 && (
							<Alert
								color="yellow"
								icon={<IconAlertTriangle size={16} />}
								title="Perhatian"
							>
								Mengganti password akan mengeluarkan user ini dari semua sesi
								aktifnya.
							</Alert>
						)}

						<Group justify="flex-end" gap="sm">
							<Button type="button" variant="default" onClick={onClose}>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={mutation.isPending}
								disabled={mutation.isPending}
							>
								{isEditing ? "Save changes" : "Create user"}
							</Button>
						</Group>
					</Stack>
				</form>
			)}
		</Modal>
	);
}
