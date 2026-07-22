import { zodResolver } from "@hookform/resolvers/zod";
import {
	Box,
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
import { IconPhoto } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import {
	type ColorInput as ColorInputBody,
	createColor,
	HEX_PATTERN,
	updateColor,
	withHash,
} from "@/api/colors";
import type { FinishColor } from "@/api/finishes";
import { getMediaPreviewUrl } from "@/api/media";
import { notify } from "@/components/notify";
import { type ColorFormData, colorSchema } from "./colorSchema";
import { HexColorInput } from "./HexColorInput";
import { MediaPickerModal } from "./MediaPickerModal";

interface FinishOption {
	id: string;
	name: string;
	/** Dibutuhkan untuk mencegah nama color duplikat dalam satu material type. */
	colors: FinishColor[];
}

interface ColorEditorModalProps {
	opened: boolean;
	/** Bentuk ringkas dari GET /finishes — tanpa `finishesId`. */
	initial?: FinishColor;
	finishes: FinishOption[];
	/** Finish tempat color ini berada (atau tujuan saat menambah color baru). */
	finishId: string | null;
	onClose: () => void;
	/**
	 * Dipanggil SETELAH animasi tutup selesai. Parent memakai ini untuk
	 * membersihkan state `initial`/`finishId` — kalau dibersihkan sinkron di
	 * `onClose`, judul & preview sempat berkedip ke state kosong saat modal
	 * masih terlihat.
	 */
	onExited?: () => void;
}

export function ColorEditorModal({
	opened,
	initial,
	finishes,
	finishId,
	onClose,
	onExited,
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
		setError,
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
			// Bentuk form = bentuk API (6 karakter tanpa "#"), tanpa konversi.
			hex: initial?.hexCode ?? "",
			// AMBIL .id — swatchPhoto itu objek File, tapi form menyimpan uuid-nya
			// saja karena itulah yang nanti dikirim sebagai `swatchImage`.
			photo: initial?.swatchPhoto?.id ?? undefined,
			notes: initial?.notes ?? "",
			finishId: finishId ?? "",
		});
		setPhotoPreview(
			initial?.swatchPhoto
				? getMediaPreviewUrl(initial.swatchPhoto)
				: undefined,
		);
	}, [opened, initial, finishId, reset]);

	const name = watch("name");
	const hex = watch("hex") ?? "";
	const photo = watch("photo");
	const selectedFinish = watch("finishId");

	const finishName = finishes.find((f) => f.id === selectedFinish)?.name ?? "";

	// Hanya dirender kalau sudah 6 karakter — CSS "background-color: ff0000"
	// (tanpa "#") tidak valid dan diam-diam jatuh ke transparan.
	const cssHex = HEX_PATTERN.test(hex) ? withHash(hex) : undefined;

	const mutation = useMutation({
		mutationFn: (body: ColorInputBody) =>
			initial ? updateColor(initial.id, body) : createColor(body),
		onSuccess: () => {
			notify.success(isEditing ? "Color diperbarui" : "Color dibuat");
			// Daftar color di layar datang dari GET /finishes, bukan GET /colors.
			queryClient.invalidateQueries({ queryKey: ["finishes"] });
			onClose();
		},
		onError: (error) => {
			// Nama field di API berbeda dengan di form (lihat ColorInputBody).
			// Petakan balik supaya error 422 dari backend menempel di input yang
			// benar, bukan cuma jadi toast "validation failed".
			const apiToForm: Record<string, keyof ColorFormData> = {
				color: "name",
				hex: "hex",
				finishId: "finishId",
				notes: "notes",
				swatchImage: "photo",
			};
			const fieldErrors = getApiFieldErrors(error);
			const entries = Object.entries(fieldErrors).filter(
				([apiField]) => apiField in apiToForm,
			);
			if (entries.length > 0) {
				for (const [apiField, message] of entries) {
					setError(apiToForm[apiField], { message });
				}
				return;
			}
			notify.error(getApiErrorMessage(error));
		},
	});

	const onSubmit = (data: ColorFormData) => {
		// Cegah nama color duplikat DALAM SATU material type, konsisten dengan
		// guard duplikat material type di ColorList. Tiga hal penting:
		// - dicek terhadap finish TUJUAN (data.finishId), bukan finish asal —
		//   Select memungkinkan memindahkan color antar material type;
		// - `c.id !== initial?.id` supaya saat edit, color tidak dianggap
		//   duplikat terhadap dirinya sendiri;
		// - nama sama di material type BERBEDA tetap boleh (mis. "Merah Bata"
		//   ada di Matte sekaligus Gloss).
		const targetFinish = finishes.find((f) => f.id === data.finishId);
		const duplicate = targetFinish?.colors.find(
			(c) =>
				c.name.trim().toLowerCase() === data.name.toLowerCase() &&
				c.id !== initial?.id,
		);
		if (duplicate) {
			setError("name", {
				message: `Color "${duplicate.name}" sudah ada di material type ini`,
			});
			return;
		}

		mutation.mutate({
			color: data.name, // name  → color
			hex: data.hex, // sudah 6 karakter lowercase tanpa "#"
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
				onExitTransitionEnd={onExited}
				// `finishName` bisa kosong sesaat sebelum form ter-reset — rangkai
				// lewat filter+join supaya tidak jadi "Add  color" (spasi ganda).
				title={
					isEditing
						? "Edit color"
						: ["Add", finishName, "color"].filter(Boolean).join(" ")
				}
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
									backgroundColor: cssHex ?? "transparent",
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
									{cssHex ?? "No colour set"}
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
									<HexColorInput
										value={field.value ?? ""}
										onChange={field.onChange}
										onBlur={field.onBlur}
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
							error={errors.notes?.message}
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
