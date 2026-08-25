import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Card,
	Grid,
	Group,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	type HeroSectionFormData,
	heroSectionSchema,
} from "./heroSectionSchema";
import { ImageUploadCard } from "./ImageUploadCard";
import type { HeroSection } from "./landingTypes";

/** Buang "/" di depan supaya tidak dobel dengan leftSection input. */
function stripLeadingSlash(value: string) {
	return value.replace(/^\/+/, "");
}

interface HeroSectionEditorProps {
	section: HeroSection;
	/** `imageFile` = gambar baru yang dipilih user, belum diupload — null kalau tidak diganti. */
	onSave: (data: HeroSectionFormData, imageFile: File | null) => void;
	onCancel: () => void;
	isSaving?: boolean;
	canSave?: boolean;
}

export function HeroSectionEditor({
	section,
	onSave,
	onCancel,
	isSaving = false,
	canSave = true,
}: HeroSectionEditorProps) {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<HeroSectionFormData>({
		resolver: zodResolver(heroSectionSchema),
		defaultValues: {
			subtitle: section.subtitle,
			title: section.title,
			ctaText: section.ctaText,
			ctaLink: stripLeadingSlash(section.ctaLink),
			imageUrl: section.image.url,
			imageAlt: section.image.alt,
		},
	});

	// File baru yang dipilih user — ditahan di sini, dikirim saat Save (lihat
	// ImageUploadCard). Bukan bagian dari heroSectionSchema.
	const [imageFile, setImageFile] = useState<File | null>(null);

	const imageUrl = watch("imageUrl");
	const imageAlt = watch("imageAlt");
	const ctaText = watch("ctaText");
	const hasCtaText = ctaText.trim().length > 0;

	const onSubmit = (data: HeroSectionFormData) => {
		const text = data.ctaText.trim();
		// Link tanpa teks tak pernah tampil di storefront — buang saja.
		const link = text ? stripLeadingSlash(data.ctaLink.trim()) : "";
		onSave(
			{
				...data,
				ctaText: text,
				ctaLink: link ? `/${link}` : "",
			},
			imageFile,
		);
	};

	return (
		<>
			<Grid gap="lg">
				{/* KIRI — Hero Image */}
				<Grid.Col span={{ base: 12, md: 5 }}>
					<ImageUploadCard
						title="Hero Image"
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
								label="Subtitle"
								description="Small text above the title"
								{...register("subtitle")}
								error={errors.subtitle?.message}
							/>
							<Textarea
								label="Title"
								autosize
								minRows={2}
								{...register("title")}
								error={errors.title?.message}
							/>
							<TextInput
								label="CTA text (optional)"
								{...register("ctaText")}
								error={errors.ctaText?.message}
							/>
							{hasCtaText && (
								<TextInput
									label="CTA link"
									leftSection="/"
									placeholder="products"
									{...register("ctaLink")}
									error={errors.ctaLink?.message}
								/>
							)}
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
