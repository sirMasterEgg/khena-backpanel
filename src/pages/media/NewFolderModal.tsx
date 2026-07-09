import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

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
	const [name, setName] = useState("");

	// Reset input setiap kali modal dibuka.
	useEffect(() => {
		if (opened) setName("");
	}, [opened]);

	const canSubmit = name.trim().length > 0;

	const handleCreate = () => {
		if (!canSubmit) return;
		onCreate(name.trim());
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Create a new folder"
			centered
		>
			<Stack gap="md">
				<TextInput
					label="Folder name"
					placeholder="e.g. Sofa"
					description={`Folder akan dibuat di kategori "${categoryName}".`}
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
					data-autofocus
				/>
				<Group justify="space-between">
					<Button variant="default" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={!canSubmit}>
						Create folder
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
