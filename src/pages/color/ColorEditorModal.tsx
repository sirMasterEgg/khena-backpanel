import {
	Box,
	Button,
	ColorInput,
	Group,
	Image,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { Color } from "@/data/dummy";
import { MediaPickerModal } from "./MediaPickerModal";

interface Category {
	id: number;
	name: string;
}

interface ColorEditorModalProps {
	opened: boolean;
	initial?: Color;
	categories: Category[];
	categoryId: number | null;
	onClose: () => void;
	onSave: (color: Color, categoryId: number) => void;
}

export function ColorEditorModal({
	opened,
	initial,
	categories,
	categoryId,
	onClose,
	onSave,
}: ColorEditorModalProps) {
	const [name, setName] = useState("");
	const [hex, setHex] = useState("");
	const [photo, setPhoto] = useState<string | undefined>(undefined);
	const [notes, setNotes] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [mediaOpened, setMediaOpened] = useState(false);

	const isEditing = Boolean(initial);

	// Sync form state whenever the modal is (re)opened.
	useEffect(() => {
		if (!opened) return;
		setName(initial?.name ?? "");
		setHex(initial?.hex ?? "");
		setPhoto(initial?.photo);
		setNotes(initial?.notes ?? "");
		setSelectedCategory(categoryId != null ? String(categoryId) : null);
	}, [opened, initial, categoryId]);

	const categoryName =
		categories.find((c) => String(c.id) === selectedCategory)?.name ?? "";

	const hasColour = Boolean(photo) || hex.trim().length > 0;
	const canSubmit = name.trim().length > 0 && hasColour && selectedCategory;

	const statusLabel = hex.trim()
		? hex
		: photo
			? "Photo swatch"
			: "No colour set";

	const handleSave = () => {
		if (!canSubmit || selectedCategory == null) return;
		const color: Color = {
			id: initial?.id ?? Date.now(),
			name: name.trim(),
			hex: hex.trim() || undefined,
			photo,
			notes: notes.trim() || undefined,
		};
		onSave(color, Number(selectedCategory));
		onClose();
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				title={isEditing ? "Edit color" : `Add ${categoryName} color`}
				centered
			>
				<Stack gap="md">
					{/* Preview block */}
					<Group
						gap="sm"
						wrap="nowrap"
						p="sm"
						style={{
							border: "1px solid var(--mantine-color-gray-3)",
							borderRadius: 8,
						}}
					>
						<Box
							style={{
								width: 44,
								height: 44,
								borderRadius: "50%",
								flexShrink: 0,
								border: "1px solid var(--mantine-color-gray-3)",
								backgroundColor: hex.trim() || "transparent",
								backgroundImage: photo ? `url(${photo})` : undefined,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						/>
						<Stack gap={2} style={{ minWidth: 0 }}>
							<Text fw={500} truncate>
								{name.trim() || "Untitled color"}
							</Text>
							<Text size="xs" c="dimmed" truncate>
								{statusLabel}
								{categoryName ? ` · ${categoryName}` : ""}
							</Text>
						</Stack>
					</Group>

					{/* Color name */}
					<TextInput
						label="Color name"
						placeholder="e.g. Sand Linen"
						required
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
					/>

					{/* Swatch photo */}
					<Stack gap={4}>
						<Text size="sm" fw={500}>
							Swatch photo
						</Text>
						{photo ? (
							<Group gap="sm" align="flex-start" wrap="nowrap">
								<Image
									src={photo}
									w={72}
									h={72}
									radius="md"
									fit="cover"
									alt="Swatch"
								/>
								<Stack gap="xs">
									<Button
										variant="default"
										size="xs"
										onClick={() => setMediaOpened(true)}
									>
										Replace photo
									</Button>
									<Button
										variant="subtle"
										color="red"
										size="xs"
										onClick={() => setPhoto(undefined)}
									>
										Remove
									</Button>
								</Stack>
							</Group>
						) : (
							<Button
								variant="default"
								leftSection={<IconPhoto size={18} />}
								onClick={() => setMediaOpened(true)}
								h="auto"
								py="md"
								styles={{
									root: {
										borderStyle: "dashed",
										width: "100%",
										flexDirection: "column",
									},
									label: { flexDirection: "column", gap: 4 },
								}}
							>
								<span>Choose from Media Library</span>
								<Text component="span" size="xs" c="dimmed" fw={400}>
									Pick a photo swatch for this colour.
								</Text>
							</Button>
						)}
					</Stack>

					{/* Approximate colour + Category */}
					<Group grow align="flex-start">
						<ColorInput
							label="Approximate colour (optional)"
							placeholder="#888888"
							value={hex}
							onChange={setHex}
							withEyeDropper={false}
						/>
						<Select
							label="Category"
							data={categories.map((c) => ({
								value: String(c.id),
								label: c.name,
							}))}
							value={selectedCategory}
							onChange={setSelectedCategory}
							allowDeselect={false}
						/>
					</Group>

					{!hasColour && (
						<Text size="xs" c="dimmed">
							Add a photo, or pick an approximate colour — at least one is
							needed.
						</Text>
					)}

					{/* Notes */}
					<Textarea
						label="Notes (optional)"
						placeholder="Supplier code, finishing details, etc."
						value={notes}
						onChange={(e) => setNotes(e.currentTarget.value)}
						autosize
						minRows={2}
					/>

					{/* Footer */}
					<Group justify="flex-end" gap="sm">
						<Button variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!canSubmit}>
							{isEditing ? "Save changes" : "Add color"}
						</Button>
					</Group>
				</Stack>
			</Modal>

			<MediaPickerModal
				opened={mediaOpened}
				onClose={() => setMediaOpened(false)}
				onSelect={setPhoto}
			/>
		</>
	);
}
