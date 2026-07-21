import {
	Center,
	Image,
	Loader,
	Modal,
	SimpleGrid,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { browseMedia, getMediaPreviewUrl, type MediaFile } from "@/api/media";
import { MediaBreadcrumb } from "@/pages/media/MediaBreadcrumb";

interface MediaPickerModalProps {
	opened: boolean;
	onClose: () => void;
	/**
	 * Mengirim objek MediaFile utuh — pemanggil butuh `id` (untuk `swatchImage`)
	 * DAN URL preview, dan keduanya sudah ada di objek ini tanpa request tambahan.
	 */
	onSelect: (file: MediaFile) => void;
}

export function MediaPickerModal({
	opened,
	onClose,
	onSelect,
}: MediaPickerModalProps) {
	const [currentPath, setCurrentPath] = useState("/");

	const { data, isLoading, isError, error } = useQuery({
		// Swatch tidak masuk akal berupa video/dokumen → batasi ke image saja.
		queryKey: ["media", currentPath, { type: "image" }],
		queryFn: () => browseMedia(currentPath, { type: "image" }),
		enabled: opened,
	});

	// File `pending` = upload multipart yang belum selesai, isinya belum utuh.
	const files = (data?.files ?? []).filter((f) => f.status === "ready");
	const folders = data?.folders ?? [];

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Media Library"
			size="lg"
			centered
		>
			<MediaBreadcrumb currentPath={currentPath} onNavigate={setCurrentPath} />

			{isLoading ? (
				<Center py="xl">
					<Loader size="sm" />
				</Center>
			) : isError ? (
				<Text c="red" size="sm" ta="center" py="xl">
					{getApiErrorMessage(error)}
				</Text>
			) : folders.length === 0 && files.length === 0 ? (
				<Text c="dimmed" size="sm" ta="center" py="xl">
					Belum ada gambar di folder ini.
				</Text>
			) : (
				<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
					{folders.map((folder) => (
						<UnstyledButton
							key={folder.id}
							onClick={() => setCurrentPath(folder.path)}
							style={{
								borderRadius: 8,
								border: "1px solid var(--mantine-color-gray-3)",
								padding: 12,
							}}
						>
							<Stack gap={4} align="center">
								<IconFolder size={32} />
								<Text size="xs" ta="center" lineClamp={2}>
									{folder.name}
								</Text>
							</Stack>
						</UnstyledButton>
					))}
					{files.map((file) => (
						<UnstyledButton
							key={file.id}
							onClick={() => {
								onSelect(file);
								onClose();
							}}
							style={{
								borderRadius: 8,
								overflow: "hidden",
								border: "1px solid var(--mantine-color-gray-3)",
							}}
						>
							<Image
								src={getMediaPreviewUrl(file)}
								h={120}
								fit="cover"
								alt={file.altText ?? file.name}
							/>
						</UnstyledButton>
					))}
				</SimpleGrid>
			)}
		</Modal>
	);
}
