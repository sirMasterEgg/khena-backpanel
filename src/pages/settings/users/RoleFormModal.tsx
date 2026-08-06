import { zodResolver } from "@hookform/resolvers/zod";
import {
	Alert,
	Button,
	Center,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import { listPermissions } from "@/api/permissions";
import {
	createRole,
	getRole,
	patchRole,
	type RolePatchInput,
} from "@/api/roles";
import { notify } from "@/components/notify";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionMatrix } from "./PermissionMatrix";
import { type RoleFormData, roleFormSchema } from "./roleFormSchema";

interface RoleFormModalProps {
	opened: boolean;
	/** Ada → mode edit (fetch GET /roles/:id lalu PATCH). Tidak ada → mode create (POST). */
	roleId?: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const emptyFormValues: RoleFormData = {
	name: "",
	description: "",
	permissions: [],
};

export function RoleFormModal({
	opened,
	roleId,
	onClose,
	onSuccess,
}: RoleFormModalProps) {
	const isEditing = Boolean(roleId);
	const { can } = usePermissions();
	const canReadPermissions = can("permission.read");
	const queryClient = useQueryClient();

	const detailQuery = useQuery({
		queryKey: ["roles", roleId],
		queryFn: () => getRole(roleId as string),
		enabled: opened && Boolean(roleId),
	});
	const initial = detailQuery.data;

	const permissionsQuery = useQuery({
		queryKey: ["permissions"],
		queryFn: listPermissions,
		enabled: opened && canReadPermissions,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const {
		control,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<RoleFormData>({
		resolver: zodResolver(roleFormSchema),
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
				description: initial.description ?? "",
				permissions: initial.permissions,
			});
		} else if (!roleId) {
			reset(emptyFormValues);
		}
	}, [opened, initial, roleId, reset]);

	const mutation = useMutation({
		mutationFn: (data: RoleFormData) => {
			if (roleId) {
				const body: RolePatchInput = {
					name: data.name.trim(),
					description: data.description.trim() || null,
				};
				if (canReadPermissions) body.permissions = data.permissions;
				return patchRole(roleId, body);
			}
			return createRole({
				name: data.name.trim(),
				description: data.description.trim() || undefined,
				permissions: data.permissions,
			});
		},
		onSuccess: () => {
			notify.success(isEditing ? "Role updated" : "Role created");
			queryClient.invalidateQueries({ queryKey: ["administrators"] });
			onSuccess?.();
			onClose();
		},
		onError: (error) => {
			const fieldErrors = getApiFieldErrors(error);
			if (Object.keys(fieldErrors).length > 0) {
				for (const [field, message] of Object.entries(fieldErrors)) {
					setError(field as keyof RoleFormData, { message });
				}
				return;
			}
			notify.error(getApiErrorMessage(error));
		},
	});

	const onSubmit = (data: RoleFormData) => {
		mutation.mutate(data);
	};

	const isLoadingDetail = isEditing && detailQuery.isLoading;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEditing ? "Edit Role" : "New Role"}
			size="lg"
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
									placeholder="e.g. Warehouse Staff"
									{...field}
									error={errors.name?.message}
								/>
							)}
						/>

						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<Textarea
									label="Description"
									placeholder="e.g. Akses stok & PO"
									{...field}
								/>
							)}
						/>

						<div>
							<Text size="sm" fw={500} mb="xs">
								Permissions
							</Text>
							{canReadPermissions ? (
								permissionsQuery.isLoading ? (
									<Center py="md">
										<Loader size="sm" />
									</Center>
								) : (
									<Controller
										name="permissions"
										control={control}
										render={({ field }) => (
											<PermissionMatrix
												permissions={permissionsQuery.data ?? []}
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
								)
							) : (
								<Alert color="yellow">
									Anda tidak punya izin melihat daftar permission.
								</Alert>
							)}
						</div>

						<Group justify="flex-end" gap="sm">
							<Button type="button" variant="default" onClick={onClose}>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={mutation.isPending}
								disabled={mutation.isPending}
							>
								{isEditing ? "Save changes" : "Create role"}
							</Button>
						</Group>
					</Stack>
				</form>
			)}
		</Modal>
	);
}
