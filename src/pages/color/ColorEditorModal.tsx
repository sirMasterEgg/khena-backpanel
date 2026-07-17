import { zodResolver } from "@hookform/resolvers/zod";
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
import { Controller, useForm } from "react-hook-form";
import type { Color } from "@/data/dummy";
import { type ColorFormData, colorSchema } from "./colorSchema";
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
	const [mediaOpened, setMediaOpened] = useState(false);

	const {
		control,
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm<ColorFormData>({
		resolver: zodResolver(colorSchema),
		defaultValues: {
			name: "",
			hex: "",
			photo: undefined,
			notes: "",
			categoryId: "",
		},
	});

	const isEditing = Boolean(initial);

	// Sync form state whenever the modal is (re)opened.
	useEffect(() => {
		if (!opened) return;
		reset({
			name: initial?.name ?? "",
			hex: initial?.hex ?? "",
			photo: initial?.photo,
			notes: initial?.notes ?? "",
			categoryId: categoryId != null ? String(categoryId) : "",
		});
	}, [opened, initial, categoryId, reset]);

	const name = watch("name");
	const hex = watch("hex") ?? "";
	const photo = watch("photo");
	const selectedCategory = watch("categoryId");

	const categoryName =
		categories.find((c) => String(c.id) === selectedCategory)?.name ?? "";

	const hasColour = Boolean(photo) || hex.trim().length > 0;

	const statusLabel = hex.trim()
		? hex
		: photo
			? "Photo swatch"
			: "No colour set";

	const onSubmit = (data: ColorFormData) => {
		const color: Color = {
			id: initial?.id ?? Date.now(),
			name: data.name,
			hex: data.hex?.trim() || undefined,
			photo: data.photo,
			notes: data.notes?.trim() || undefined,
		};
		onSave(color, Number(data.categoryId));
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
				<form onSubmit={handleSubmit(onSubmit)}>
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
							{...register("name")}
							error={errors.name?.message}
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
											type="button"
											variant="default"
											size="xs"
											onClick={() => setMediaOpened(true)}
										>
											Replace photo
										</Button>
										<Button
											type="button"
											variant="subtle"
											color="red"
											size="xs"
											onClick={() =>
												setValue("photo", undefined, {
													shouldValidate: true,
												})
											}
										>
											Remove
										</Button>
									</Stack>
								</Group>
							) : (
								<Button
									type="button"
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
							<Controller
								name="hex"
								control={control}
								render={({ field }) => (
									<ColorInput
										label="Approximate colour (optional)"
										placeholder="#888888"
										value={field.value ?? ""}
										onChange={field.onChange}
										withEyeDropper={false}
									/>
								)}
							/>
							<Controller
								name="categoryId"
								control={control}
								render={({ field }) => (
									<Select
										label="Category"
										data={categories.map((c) => ({
											value: String(c.id),
											label: c.name,
										}))}
										value={field.value}
										onChange={field.onChange}
										allowDeselect={false}
										error={errors.categoryId?.message}
									/>
								)}
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
							{...register("notes")}
							autosize
							minRows={2}
						/>

						{/* Footer */}
						<Group justify="flex-end" gap="sm">
							<Button type="button" variant="default" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit">
								{isEditing ? "Save changes" : "Add color"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<MediaPickerModal
				opened={mediaOpened}
				onClose={() => setMediaOpened(false)}
				onSelect={(url) => setValue("photo", url, { shouldValidate: true })}
			/>
		</>
	);
}
