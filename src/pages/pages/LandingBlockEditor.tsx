import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Button,
	Card,
	Center,
	Grid,
	Group,
	Image,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { getMediaPreviewUrl } from "@/api/media";
import type { LandingBlock } from "@/data/dummy";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import {
	type LandingBlockFormData,
	landingBlockSchema,
} from "./landingBlockSchema";

interface LandingBlockEditorProps {
	block: LandingBlock;
	onSave: (data: LandingBlockFormData) => void;
	onCancel: () => void;
}

export function LandingBlockEditor({
	block,
	onSave,
	onCancel,
}: LandingBlockEditorProps) {
	const [pickerOpened, setPickerOpened] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<LandingBlockFormData>({
		resolver: zodResolver(landingBlockSchema),
		defaultValues: {
			name: block.name,
			headline: block.headline,
			buttonLabel: block.buttonLabel,
			buttonDestination: block.buttonDestination ?? "",
			mediaUrl: block.mediaUrl,
		},
	});

	const mediaUrl = watch("mediaUrl");

	const onSubmit = (data: LandingBlockFormData) => onSave(data);

	return (
		<>
			<Grid gap="lg">
				{/* KIRI — Hero Image */}
				<Grid.Col span={{ base: 12, md: 5 }}>
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Hero Image</Text>
							{mediaUrl ? (
								<Image src={mediaUrl} radius="sm" h={240} fit="cover" />
							) : (
								<Center
									h={240}
									style={{
										border: "1px dashed var(--mantine-color-gray-4)",
										borderRadius: "var(--mantine-radius-sm)",
									}}
								>
									<Text c="dimmed" size="sm">
										No image selected
									</Text>
								</Center>
							)}
							{errors.mediaUrl && (
								<Text size="xs" c="red">
									{errors.mediaUrl.message}
								</Text>
							)}
							<Group justify="space-between">
								<Button
									type="button"
									variant="default"
									onClick={() => setPickerOpened(true)}
								>
									{mediaUrl ? "Replace" : "Choose"}
								</Button>
								<ActionIcon
									type="button"
									variant="subtle"
									color="red"
									aria-label="Remove image"
									disabled={!mediaUrl}
									onClick={() =>
										setValue("mediaUrl", "", { shouldDirty: true })
									}
								>
									<IconTrash size={16} />
								</ActionIcon>
							</Group>
						</Stack>
					</Card>
				</Grid.Col>

				{/* KANAN — Block details */}
				<Grid.Col span={{ base: 12, md: 7 }}>
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Block details</Text>
							<TextInput
								label="Block name"
								{...register("name")}
								error={errors.name?.message}
							/>
							<Textarea
								label="Headline"
								autosize
								minRows={2}
								{...register("headline")}
								error={errors.headline?.message}
							/>
							<TextInput
								label="Button label"
								{...register("buttonLabel")}
								error={errors.buttonLabel?.message}
							/>
							<TextInput
								label="Button destination"
								placeholder="e.g. /products (leave blank for no destination)"
								{...register("buttonDestination")}
								error={errors.buttonDestination?.message}
							/>
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

			<MediaPickerModal
				opened={pickerOpened}
				onClose={() => setPickerOpened(false)}
				onSelect={(file) => {
					setValue("mediaUrl", getMediaPreviewUrl(file), {
						shouldDirty: true,
					});
					setPickerOpened(false);
				}}
			/>
		</>
	);
}
