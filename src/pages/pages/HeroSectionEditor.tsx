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
			eyebrow: section.eyebrow,
			headline: section.headline,
			ctaLabel: section.ctaLabel,
			ctaHref: stripLeadingSlash(section.ctaHref),
			imageUrl: section.image.url,
			imageAlt: section.image.alt,
		},
	});

	// File baru yang dipilih user — ditahan di sini, dikirim saat Save (lihat
	// ImageUploadCard). Bukan bagian dari heroSectionSchema.
	const [imageFile, setImageFile] = useState<File | null>(null);

	const imageUrl = watch("imageUrl");
	const imageAlt = watch("imageAlt");
	const ctaLabel = watch("ctaLabel");
	const hasCtaLabel = ctaLabel.trim().length > 0;

	const onSubmit = (data: HeroSectionFormData) => {
		const text = data.ctaLabel.trim();
		// Link tanpa teks tak pernah tampil di storefront — buang saja.
		const link = text ? stripLeadingSlash(data.ctaHref.trim()) : "";
		onSave(
			{
				...data,
				ctaLabel: text,
				ctaHref: link ? `/${link}` : "",
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
								label="Eyebrow"
								description="Small text above the headline"
								{...register("eyebrow")}
								error={errors.eyebrow?.message}
							/>
							<Textarea
								label="Headline"
								autosize
								minRows={2}
								{...register("headline")}
								error={errors.headline?.message}
							/>
							<TextInput
								label="CTA label (optional)"
								{...register("ctaLabel")}
								error={errors.ctaLabel?.message}
							/>
							{hasCtaLabel && (
								<TextInput
									label="CTA href"
									leftSection="/"
									placeholder="products"
									{...register("ctaHref")}
									error={errors.ctaHref?.message}
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
