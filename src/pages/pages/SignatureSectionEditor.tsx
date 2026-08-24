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
import { useForm } from "react-hook-form";
import type { SignatureCollectionSection } from "@/data/dummy";
import { ImageUploadCard } from "./ImageUploadCard";
import {
	type SignatureSectionFormData,
	signatureSectionSchema,
} from "./signatureSectionSchema";

interface SignatureSectionEditorProps {
	section: SignatureCollectionSection;
	onSave: (data: SignatureSectionFormData) => void;
	onCancel: () => void;
}

export function SignatureSectionEditor({
	section,
	onSave,
	onCancel,
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

	const imageUrl = watch("imageUrl");
	const imageAlt = watch("imageAlt");

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
								label="Title"
								{...register("title")}
								error={errors.title?.message}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>

			<Group justify="flex-end" mt="lg">
				<Button type="button" variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" onClick={handleSubmit(onSave)}>
					Save changes
				</Button>
			</Group>
		</>
	);
}
