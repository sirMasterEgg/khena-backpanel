import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconFileTypePdf } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { MediaFile } from "@/api/media";
import type { AssemblyManual } from "@/data/dummy";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import {
	type AssemblyManualFormData,
	assemblyManualSchema,
} from "./assemblyManualSchema";

/** Perkiraan ukuran file dari MediaFile — dummy data cukup pakai KB/MB kasar. */
function formatFileSize(bytes: number) {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface AssemblyManualModalProps {
	opened: boolean;
	onClose: () => void;
	onSave: (data: AssemblyManualFormData & { fileSize: string }) => void;
	manual?: AssemblyManual | null;
}

export function AssemblyManualModal({
	opened,
	onClose,
	onSave,
	manual,
}: AssemblyManualModalProps) {
	const isEdit = Boolean(manual);
	const [pickerOpened, setPickerOpened] = useState(false);
	const [fileSize, setFileSize] = useState("");

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<AssemblyManualFormData>({
		resolver: zodResolver(assemblyManualSchema),
		defaultValues: { productName: "", productSku: "", fileName: "" },
	});

	const fileName = watch("fileName");

	useEffect(() => {
		if (!opened) return;
		reset({
			productName: manual?.productName ?? "",
			productSku: manual?.productSku ?? "",
			fileName: manual?.fileName ?? "",
		});
		setFileSize(manual?.fileSize ?? "");
	}, [opened, manual, reset]);

	const handlePick = (file: MediaFile) => {
		setValue("fileName", file.name, { shouldValidate: true });
		setFileSize(formatFileSize(file.sizeBytes));
		setPickerOpened(false);
	};

	const onSubmit = (data: AssemblyManualFormData) => {
		onSave({ ...data, fileSize });
		onClose();
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				title={isEdit ? "Replace manual" : "Add manual"}
				centered
			>
				<Stack gap="md">
					<TextInput
						label="Product name"
						{...register("productName")}
						error={errors.productName?.message}
					/>
					<TextInput
						label="SKU (optional)"
						{...register("productSku")}
						error={errors.productSku?.message}
					/>
					<Stack gap="xs">
						<Text size="sm" fw={500}>
							PDF file
						</Text>
						{fileName && (
							<Group gap="xs">
								<IconFileTypePdf size={18} />
								<Text size="sm">{fileName}</Text>
							</Group>
						)}
						{errors.fileName && (
							<Text size="xs" c="red">
								{errors.fileName.message}
							</Text>
						)}
						<Button
							type="button"
							variant="default"
							onClick={() => setPickerOpened(true)}
						>
							Choose PDF
						</Button>
					</Stack>
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
				onSelect={handlePick}
				type="document"
			/>
		</>
	);
}
