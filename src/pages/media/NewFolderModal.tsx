import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { type NewFolderFormData, newFolderSchema } from "./newFolderSchema";

interface NewFolderModalProps {
	opened: boolean;
	/** Nama kategori tempat folder akan dibuat. */
	categoryName: string;
	onClose: () => void;
	onCreate: (name: string) => void;
}

export function NewFolderModal({
	opened,
	categoryName,
	onClose,
	onCreate,
}: NewFolderModalProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<NewFolderFormData>({
		resolver: zodResolver(newFolderSchema),
		defaultValues: { name: "" },
	});

	// Reset input setiap kali modal dibuka.
	useEffect(() => {
		if (opened) reset({ name: "" });
	}, [opened, reset]);

	const onSubmit = (data: NewFolderFormData) => {
		onCreate(data.name);
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Create a new folder"
			centered
		>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack gap="md">
					<TextInput
						label="Folder name"
						placeholder="e.g. Sofa"
						description={`Folder akan dibuat di kategori "${categoryName}".`}
						data-autofocus
						{...register("name")}
						error={errors.name?.message}
					/>
					<Group justify="space-between">
						<Button type="button" variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Create folder</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
