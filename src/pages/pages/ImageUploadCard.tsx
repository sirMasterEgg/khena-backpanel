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
import { useEffect, useRef } from "react";
import { PAGES_ACCEPTED_IMAGE_TYPES, PAGES_MAX_IMAGE_BYTES } from "@/api/pages";
import { notify } from "@/components/notify";
import type { ImageValue } from "./pagesMapper";

interface ImageUploadCardProps {
	title: string; // judul card, mis. "Hero Image"
	url: string;
	alt: string;
	urlError?: string;
	altError?: string;
	onImageChange: (value: ImageValue) => void;
	onAltChange: (alt: string) => void;
}

/**
 * Card upload gambar + alt text — dipakai bersama oleh editor hero, signature, dst.
 *
 * File yang dipilih TIDAK langsung diupload. Ia ditahan (lewat `onImageChange`)
 * sampai user menekan Save section, lalu dikirim bersama request POST/PATCH
 * lewat placeholder `@file:` (lihat src/api/pages.ts). `url` di sini hanya
 * dipakai sebagai preview — bisa berupa URL server lama, atau object URL blob
 * dari file yang baru dipilih.
 */
export function ImageUploadCard({
	title,
	url,
	alt,
	urlError,
	altError,
	onImageChange,
	onAltChange,
}: ImageUploadCardProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	// Blob URL yang sedang aktif (kalau ada) — dilacak supaya bisa di-revoke
	// saat diganti atau saat komponen unmount, supaya tidak bocor memori.
	const objectUrlRef = useRef<string | null>(null);

	useEffect(() => {
		objectUrlRef.current = url.startsWith("blob:") ? url : null;
	}, [url]);

	useEffect(() => {
		return () => {
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
		};
	}, []);

	const handleFileSelected = (list: FileList | null) => {
		const file = list?.[0];
		// Reset value supaya file yang sama bisa dipilih lagi setelah ini.
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (!file) return;
		if (file.size > PAGES_MAX_IMAGE_BYTES) {
			notify.error("Ukuran gambar melebihi 5 MB");
			return;
		}
		if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
		onImageChange({ url: URL.createObjectURL(file), alt, file });
	};

	const handleRemove = () => {
		if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
		onImageChange({ url: "", alt, file: null });
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
					accept={PAGES_ACCEPTED_IMAGE_TYPES}
					hidden
					onChange={(e) => handleFileSelected(e.currentTarget.files)}
				/>
				<Group justify="space-between">
					<Button
						type="button"
						variant="default"
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
						onClick={handleRemove}
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
