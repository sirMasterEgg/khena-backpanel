import {
	Button,
	ColorInput,
	Group,
	Modal,
	Stack,
	TextInput,
} from "@mantine/core";
import { useState } from "react";
import type { Color } from "@/data/dummy";

interface ColorEditorModalProps {
	opened: boolean;
	initial?: Color;
	onClose: () => void;
	onSave: (color: Color) => void;
}

export function ColorEditorModal({
	opened,
	initial,
	onClose,
	onSave,
}: ColorEditorModalProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [hex, setHex] = useState(initial?.hex ?? "#000000");

	const handleSave = () => {
		if (!name.trim()) return;
		const color: Color = {
			id: initial?.id ?? Date.now(),
			name,
			hex,
		};
		onSave(color);
		handleClose();
	};

	const handleClose = () => {
		setName(initial?.name ?? "");
		setHex(initial?.hex ?? "#000000");
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={initial ? "Edit color" : "Add color"}
			centered
		>
			<Stack gap="md">
				<TextInput
					label="Color name"
					placeholder="e.g., Khena Black"
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
				/>
				<ColorInput
					label="Color code"
					placeholder="Pick color or paste hex"
					value={hex}
					onChange={setHex}
					withEyeDropper={false}
				/>
				<Group justify="flex-end" gap="sm">
					<Button variant="default" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
