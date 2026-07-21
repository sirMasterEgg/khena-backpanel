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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/api/client";
import {
	type ColorInput as ColorInputBody,
	createColor,
	stripHash,
	updateColor,
	withHash,
} from "@/api/colors";
import type { FinishColor } from "@/api/finishes";
import { getMediaPreviewUrl } from "@/api/media";
import { notify } from "@/components/notify";
import { type ColorFormData, colorSchema } from "./colorSchema";
import { MediaPickerModal } from "./MediaPickerModal";

interface FinishOption {
	id: string;
	name: string;
}

interface ColorEditorModalProps {
	opened: boolean;
	/** Bentuk ringkas dari GET /finishes — tanpa `finishesId`. */
	initial?: FinishColor;
	finishes: FinishOption[];
	/** Finish tempat color ini berada (atau tujuan saat menambah color baru). */
	finishId: string | null;
	onClose: () => void;
}

export function ColorEditorModal({
	opened,
	initial,
	finishes,
	finishId,
	onClose,
}: ColorEditorModalProps) {
	const queryClient = useQueryClient();
	const [mediaOpened, setMediaOpened] = useState(false);
	// Field form `photo` cuma menyimpan uuid; URL preview-nya disimpan terpisah.
	const [photoPreview, setPhotoPreview] = useState<string | undefined>();

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
			finishId: "",
		},
	});

	const isEditing = Boolean(initial);

	// Sync form state whenever the modal is (re)opened.
	useEffect(() => {
		if (!opened) return;
		reset({
			name: initial?.name ?? "",
			hex: initial ? withHash(initial.hexCode) : "",
			// AMBIL .id — swatchPhoto itu objek File, tapi form menyimpan uuid-nya
			// saja karena itulah yang nanti dikirim sebagai `swatchImage`.
			photo: initial?.swatchPhoto?.id ?? undefined,
			notes: initial?.notes ?? "",
			finishId: finishId ?? "",
		});
		setPhotoPreview(
			initial?.swatchPhoto ? getMediaPreviewUrl(initial.swatchPhoto) : undefined,
		);
	}, [opened, initial, finishId, reset]);

	const name = watch("name");
	const hex = watch("hex") ?? "";
	const photo = watch("photo");
	const selectedFinish = watch("finishId");

	const finishName = finishes.find((f) => f.id === selectedFinish)?.name ?? "";

	const mutation = useMutation({
		mutationFn: (body: ColorInputBody) =>
			initial ? updateColor(initial.id, body) : createColor(body),
		onSuccess: () => {
			notify.success(isEditing ? "Color diperbarui" : "Color dibuat");
			// Daftar color di layar datang dari GET /finishes, bukan GET /colors.
			queryClient.invalidateQueries({ queryKey: ["finishes"] });
			onClose();
		},
		onError: (error) => notify.error(getApiErrorMessage(error)),
	});

	const onSubmit = (data: ColorFormData) => {
		mutation.mutate({
			color: data.name, // name  → color
			hex: stripHash(data.hex), // buang "#"
			finishId: data.finishId,
			// Kirim undefined (bukan ""), agar tidak tertolak validasi backend.
			notes: data.notes?.trim() || undefined,
			swatchImage: data.photo || undefined, // photo → swatchImage (uuid)
		});
	};

	const clearPhoto = () => {
		setValue("photo", undefined, { shouldValidate: true });
		setPhotoPreview(undefined);
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				title={isEditing ? "Edit color" : `Add ${finishName} color`}
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
									backgroundImage: photoPreview
										? `url(${photoPreview})`
										: undefined,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
							<Stack gap={2} style={{ minWidth: 0 }}>
								<Text fw={500} truncate>
									{name.trim() || "Untitled color"}
								</Text>
								<Text size="xs" c="dimmed" truncate>
									{hex.trim() || "No colour set"}
									{finishName ? ` · ${finishName}` : ""}
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
										src={photoPreview}
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
											onClick={clearPhoto}
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

						{/* Colour + material type */}
						<Group grow align="flex-start">
							<Controller
								name="hex"
								control={control}
								render={({ field }) => (
									<ColorInput
										label="Colour"
										placeholder="#888888"
										required
										value={field.value ?? ""}
										onChange={field.onChange}
										withEyeDropper={false}
										error={errors.hex?.message}
									/>
								)}
							/>
							<Controller
								name="finishId"
								control={control}
								render={({ field }) => (
									<Select
										// Sengaja "Material type", bukan "Category" — Categories
										// adalah fitur lain yang berbeda.
										label="Material type"
										data={finishes.map((f) => ({
											value: f.id,
											label: f.name,
										}))}
										value={field.value}
										onChange={field.onChange}
										allowDeselect={false}
										error={errors.finishId?.message}
									/>
								)}
							/>
						</Group>

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
							<Button
								type="submit"
								loading={mutation.isPending}
								disabled={mutation.isPending}
							>
								{isEditing ? "Save changes" : "Add color"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<MediaPickerModal
				opened={mediaOpened}
				onClose={() => setMediaOpened(false)}
				onSelect={(file) => {
					// uuid ke form (itu yang dikirim), URL ke state preview.
					setValue("photo", file.id, { shouldValidate: true });
					setPhotoPreview(getMediaPreviewUrl(file));
				}}
			/>
		</>
	);
}
