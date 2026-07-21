import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { MediaFolder } from "@/api/media";
import { type NewFolderFormData, newFolderSchema } from "./newFolderSchema";

interface RenameFolderModalProps {
	/** Folder yang sedang di-rename; null = modal tertutup. */
	folder: MediaFolder | null;
	loading: boolean;
	onClose: () => void;
	onRename: (name: string) => void;
}

export function RenameFolderModal({
	folder,
	loading,
	onClose,
	onRename,
}: RenameFolderModalProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<NewFolderFormData>({
		resolver: zodResolver(newFolderSchema),
		defaultValues: { name: "" },
	});

	// Isi ulang dgn nama folder yang dipilih setiap kali modal dibuka.
	useEffect(() => {
		if (folder) reset({ name: folder.name });
	}, [folder, reset]);

	const onSubmit = (data: NewFolderFormData) => {
		onRename(data.name);
	};

	return (
		<Modal
			opened={folder !== null}
			onClose={onClose}
			title="Rename folder"
			centered
		>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack gap="md">
					<TextInput
						label="Folder name"
						placeholder="e.g. Sofa"
						data-autofocus
						{...register("name")}
						error={errors.name?.message}
					/>
					<Group justify="space-between">
						{/* Mantine Button default-nya type="submit" — wajib eksplisit. */}
						<Button type="button" variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" loading={loading}>
							Save
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
