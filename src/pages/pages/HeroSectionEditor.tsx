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
import { useForm } from "react-hook-form";
import type { HeroSection } from "@/data/dummy";
import {
	type HeroSectionFormData,
	heroSectionSchema,
} from "./heroSectionSchema";
import { ImageUploadCard } from "./ImageUploadCard";

/** Buang "/" di depan supaya tidak dobel dengan leftSection input. */
function stripLeadingSlash(value: string) {
	return value.replace(/^\/+/, "");
}

interface HeroSectionEditorProps {
	section: HeroSection;
	onSave: (data: HeroSectionFormData) => void;
	onCancel: () => void;
}

export function HeroSectionEditor({
	section,
	onSave,
	onCancel,
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

	const imageUrl = watch("imageUrl");
	const imageAlt = watch("imageAlt");
	const ctaText = watch("ctaText");
	const hasCtaText = ctaText.trim().length > 0;

	const onSubmit = (data: HeroSectionFormData) => {
		const text = data.ctaText.trim();
		// Link tanpa teks tak pernah tampil di storefront — buang saja.
		const link = text ? stripLeadingSlash(data.ctaLink.trim()) : "";
		onSave({
			...data,
			ctaText: text,
			ctaLink: link ? `/${link}` : "",
		});
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
						onUrlChange={(url) =>
							setValue("imageUrl", url, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
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
				<Button type="button" variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" onClick={handleSubmit(onSubmit)}>
					Save changes
				</Button>
			</Group>
		</>
	);
}
