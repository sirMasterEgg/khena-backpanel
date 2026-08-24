import {
	ActionIcon,
	Button,
	Card,
	Center,
	Group,
	Image,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { getApiErrorMessage } from "@/api/client";
import { notify } from "@/components/notify";
import {
	ACCEPTED_IMAGE_TYPES,
	MAX_IMAGE_BYTES,
	uploadLandingImages,
} from "./uploadLandingMedia";

interface ImageUploadCardProps {
	title: string; // judul card, mis. "Hero Image"
	url: string;
	alt: string;
	urlError?: string;
	altError?: string;
	onUrlChange: (url: string) => void;
	onAltChange: (alt: string) => void;
}

/** Card upload gambar + alt text — dipakai bersama oleh editor hero, signature, dst. */
export function ImageUploadCard({
	title,
	url,
	alt,
	urlError,
	altError,
	onUrlChange,
	onAltChange,
}: ImageUploadCardProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => uploadLandingImages(files),
		onSuccess: ([uploadedUrl]) => {
			if (uploadedUrl) onUrlChange(uploadedUrl);
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
		<Card withBorder>
			<Stack gap="md">
				<Text fw={600}>{title}</Text>
				{url ? (
					<Image src={url} radius="sm" h={240} fit="cover" />
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
				{urlError && (
					<Text size="xs" c="red">
						{urlError}
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
						{url ? "Replace image" : "Upload image"}
					</Button>
					<ActionIcon
						type="button"
						variant="subtle"
						color="red"
						aria-label="Remove image"
						disabled={!url}
						onClick={() => onUrlChange("")}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
				<TextInput
					label="Image alt text"
					description="Describe the image for screen readers and SEO"
					value={alt}
					onChange={(e) => onAltChange(e.currentTarget.value)}
					error={altError}
				/>
			</Stack>
		</Card>
	);
}
