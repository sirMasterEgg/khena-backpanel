import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type ContractProjectFormData,
	contractProjectSchema,
} from "./contractProjectSchema";
import type { ContractProject } from "./landingTypes";

interface ContractProjectModalProps {
	opened: boolean;
	onClose: () => void;
	onSave: (data: ContractProjectFormData) => void;
	project?: ContractProject | null;
}

export function ContractProjectModal({
	opened,
	onClose,
	onSave,
	project,
}: ContractProjectModalProps) {
	const isEdit = Boolean(project);

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ContractProjectFormData>({
		resolver: zodResolver(contractProjectSchema),
		defaultValues: {
			field: "",
			description: "",
			status: "draft",
		},
	});

	useEffect(() => {
		if (!opened) return;
		reset({
			field: project?.field ?? "",
			description: project?.description ?? "",
			status: project?.status ?? "draft",
		});
	}, [opened, project, reset]);

	const onSubmit = (data: ContractProjectFormData) => {
		onSave(data);
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEdit ? "Edit project" : "Add project"}
			centered
		>
			<Stack gap="md">
				<TextInput
					label="Field"
					placeholder="e.g. Hospitality, Office, Residential"
					{...register("field")}
					error={errors.field?.message}
				/>
				<Textarea
					label="Short description"
					autosize
					minRows={2}
					{...register("description")}
					error={errors.description?.message}
				/>
				<Controller
					name="status"
					control={control}
					render={({ field }) => (
						<Select
							label="Status"
							data={[
								{ value: "draft", label: "Draft" },
								{ value: "published", label: "Published" },
							]}
							value={field.value}
							onChange={field.onChange}
							error={errors.status?.message}
						/>
					)}
				/>

				<Group justify="flex-end" mt="sm">
					<Button type="button" variant="default" onClick={onClose}>
						Cancel
					</Button>
					<Button type="button" onClick={handleSubmit(onSubmit)}>
						Save
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
