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
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/api/client";
import { notify } from "@/components/notify";
import type { LandingBlock } from "@/data/dummy";
import {
	type LandingBlockFormData,
	landingBlockSchema,
} from "./landingBlockSchema";
import {
	ACCEPTED_IMAGE_TYPES,
	MAX_IMAGE_BYTES,
	uploadLandingImages,
} from "./uploadLandingMedia";

/** Buang "/" di depan supaya tidak dobel dengan leftSection input. */
function stripLeadingSlash(value: string) {
	return value.replace(/^\/+/, "");
}

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
	const fileInputRef = useRef<HTMLInputElement>(null);

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
			buttonDestination: stripLeadingSlash(block.buttonDestination ?? ""),
			mediaUrl: block.mediaUrl,
		},
	});

	const mediaUrl = watch("mediaUrl");
	const buttonLabel = watch("buttonLabel");
	const hasButtonLabel = buttonLabel.trim().length > 0;

	const onSubmit = (data: LandingBlockFormData) => {
		const label = data.buttonLabel.trim();
		// Destination tanpa label tak pernah tampil di storefront — buang saja.
		const destination = label
			? stripLeadingSlash(data.buttonDestination.trim())
			: "";
		onSave({
			...data,
			buttonLabel: label,
			buttonDestination: destination ? `/${destination}` : "",
		});
	};

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => uploadLandingImages(files),
		onSuccess: ([url]) => {
			if (url)
				setValue("mediaUrl", url, { shouldDirty: true, shouldValidate: true });
			notify.success("Gambar diunggah");
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleFileSelected = (list: FileList | null) => {
		const file = list?.[0];
		// Reset value supaya file yang sama bisa dipilih lagi setelah ini.
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (!file) return;
		if (file.size > MAX_IMAGE_BYTES) {
			notify.error("Ukuran gambar melebihi 10 MB");
			return;
		}
		uploadMutation.mutate([file]);
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
										No image yet — upload one
									</Text>
								</Center>
							)}
							{errors.mediaUrl && (
								<Text size="xs" c="red">
									{errors.mediaUrl.message}
								</Text>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept={ACCEPTED_IMAGE_TYPES}
								hidden
								onChange={(e) => handleFileSelected(e.currentTarget.files)}
							/>
							<Group justify="space-between">
								<Button
									type="button"
									variant="default"
									loading={uploadMutation.isPending}
									onClick={() => fileInputRef.current?.click()}
								>
									{mediaUrl ? "Replace image" : "Upload image"}
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
								label="Button label (optional)"
								{...register("buttonLabel")}
								error={errors.buttonLabel?.message}
							/>
							{hasButtonLabel && (
								<TextInput
									label="Button destination"
									description="Leave blank for no destination"
									placeholder="products"
									leftSection="/"
									{...register("buttonDestination")}
									error={errors.buttonDestination?.message}
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
