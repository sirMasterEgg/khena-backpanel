import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Card,
	Grid,
	Group,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ImageUploadCard } from "./ImageUploadCard";
import type { SignatureCollectionSection } from "./landingTypes";
import {
	type SignatureSectionFormData,
	signatureSectionSchema,
} from "./signatureSectionSchema";

interface SignatureSectionEditorProps {
	section: SignatureCollectionSection;
	/** `imageFile` = gambar baru yang dipilih user, belum diupload — null kalau tidak diganti. */
	onSave: (data: SignatureSectionFormData, imageFile: File | null) => void;
	onCancel: () => void;
	isSaving?: boolean;
	canSave?: boolean;
}

export function SignatureSectionEditor({
	section,
	onSave,
	onCancel,
	isSaving = false,
	canSave = true,
}: SignatureSectionEditorProps) {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<SignatureSectionFormData>({
		resolver: zodResolver(signatureSectionSchema),
		defaultValues: {
			title: section.title,
			imageUrl: section.image.url,
			imageAlt: section.image.alt,
		},
	});

	// File baru yang dipilih user — ditahan di sini, dikirim saat Save.
	const [imageFile, setImageFile] = useState<File | null>(null);

	const imageUrl = watch("imageUrl");
	const imageAlt = watch("imageAlt");

	const onSubmit = (data: SignatureSectionFormData) => onSave(data, imageFile);

	return (
		<>
			<Grid gap="lg">
				{/* KIRI — Image */}
				<Grid.Col span={{ base: 12, md: 5 }}>
					<ImageUploadCard
						title="Section Image"
						url={imageUrl}
						alt={imageAlt}
						urlError={errors.imageUrl?.message}
						altError={errors.imageAlt?.message}
						onImageChange={(value) => {
							setValue("imageUrl", value.url, {
								shouldDirty: true,
								shouldValidate: true,
							});
							setImageFile(value.file ?? null);
						}}
						onAltChange={(alt) =>
							setValue("imageAlt", alt, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
					/>
				</Grid.Col>

				{/* KANAN — Section content */}
				<Grid.Col span={{ base: 12, md: 7 }}>
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Section content</Text>
							<TextInput
								label="Title"
								{...register("title")}
								error={errors.title?.message}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>

			<Group justify="flex-end" mt="lg">
				<Button
					type="button"
					variant="default"
					disabled={isSaving}
					onClick={onCancel}
				>
					Cancel
				</Button>
				<Button
					type="button"
					loading={isSaving}
					disabled={!canSave}
					onClick={handleSubmit(onSubmit)}
				>
					Save changes
				</Button>
			</Group>
		</>
	);
}
