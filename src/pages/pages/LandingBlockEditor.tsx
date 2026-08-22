import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Button,
	Card,
	Center,
	Grid,
	Group,
	Image,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getMediaPreviewUrl } from "@/api/media";
import type { LandingBlock } from "@/data/dummy";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import {
	type LandingBlockFormData,
	landingBlockSchema,
} from "./landingBlockSchema";

// Tujuan tautan tombol yang tersedia di storefront.
const BUTTON_DESTINATION_OPTIONS = [
	{ value: "/products", label: "/products" },
	{ value: "/collections", label: "/collections" },
	{ value: "/contract-projects", label: "/contract-projects" },
	{ value: "/contact", label: "/contact" },
];

interface LandingBlockEditorProps {
	block: LandingBlock;
	onSave: (data: LandingBlockFormData) => void;
	onDelete: () => void;
	onCancel: () => void;
}

export function LandingBlockEditor({
	block,
	onSave,
	onDelete,
	onCancel,
}: LandingBlockEditorProps) {
	const [pickerOpened, setPickerOpened] = useState(false);

	const {
		control,
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
			buttonDestination: block.buttonDestination,
			mediaUrl: block.mediaUrl,
		},
	});

	const mediaUrl = watch("mediaUrl");

	const onSubmit = (data: LandingBlockFormData) => onSave(data);

	const confirmDelete = () => {
		modals.openConfirmModal({
			title: "Delete block",
			children: (
				<Text size="sm">
					Delete <strong>{block.name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: onDelete,
		});
	};

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
							<Controller
								name="buttonDestination"
								control={control}
								render={({ field }) => (
									<Select
										label="Button destination"
										placeholder="No destination set"
										data={BUTTON_DESTINATION_OPTIONS}
										value={field.value}
										onChange={field.onChange}
										clearable
										error={errors.buttonDestination?.message}
									/>
								)}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>

			<Group justify="space-between" mt="lg">
				<Button
					type="button"
					color="red"
					variant="light"
					onClick={confirmDelete}
				>
					Delete block
				</Button>
				<Group gap="sm">
					<Button type="button" variant="default" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="button" onClick={handleSubmit(onSubmit)}>
						Save changes
					</Button>
				</Group>
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
