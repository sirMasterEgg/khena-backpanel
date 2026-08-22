import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Group,
	Image,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getMediaPreviewUrl } from "@/api/media";
import type { ContractProject } from "@/data/dummy";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import {
	type ContractProjectFormData,
	contractProjectSchema,
} from "./contractProjectSchema";

const COVER_PLACEHOLDER = "https://placehold.co/600x400?text=No+Image";

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
	const [pickerOpened, setPickerOpened] = useState(false);

	const {
		control,
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<ContractProjectFormData>({
		resolver: zodResolver(contractProjectSchema),
		defaultValues: {
			title: "",
			field: "",
			description: "",
			coverUrl: "",
			status: "draft",
		},
	});

	const coverUrl = watch("coverUrl");

	useEffect(() => {
		if (!opened) return;
		reset({
			title: project?.title ?? "",
			field: project?.field ?? "",
			description: project?.description ?? "",
			coverUrl: project?.coverUrl ?? "",
			status: project?.status ?? "draft",
		});
	}, [opened, project, reset]);

	const onSubmit = (data: ContractProjectFormData) => {
		onSave(data);
		onClose();
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				title={isEdit ? "Edit project" : "Add project"}
				centered
			>
				<Stack gap="md">
					<Image
						src={coverUrl || COVER_PLACEHOLDER}
						radius="sm"
						h={160}
						fit="cover"
					/>
					{errors.coverUrl && (
						<Text size="xs" c="red">
							{errors.coverUrl.message}
						</Text>
					)}
					<Button
						type="button"
						variant="default"
						onClick={() => setPickerOpened(true)}
					>
						{coverUrl ? "Replace cover" : "Choose cover"}
					</Button>

					<TextInput
						label="Title"
						{...register("title")}
						error={errors.title?.message}
					/>
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

			<MediaPickerModal
				opened={pickerOpened}
				onClose={() => setPickerOpened(false)}
				onSelect={(file) => {
					setValue("coverUrl", getMediaPreviewUrl(file), {
						shouldValidate: true,
					});
					setPickerOpened(false);
				}}
			/>
		</>
	);
}
