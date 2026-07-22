import {
	Center,
	Image,
	Loader,
	Modal,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconFolder, IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { browseMedia, getMediaPreviewUrl, type MediaFile } from "@/api/media";
import { MediaBreadcrumb } from "@/pages/media/MediaBreadcrumb";

const SEARCH_DEBOUNCE_MS = 400;

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
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
	// Search backend bersifat global (abaikan path & cari di semua folder).
	const isSearching = debouncedSearch.trim().length > 0;

	const { data, isLoading, isError, error } = useQuery({
		// Swatch tidak masuk akal berupa video/dokumen → batasi ke image saja.
		queryKey: ["media", currentPath, { type: "image", search: debouncedSearch }],
		queryFn: () =>
			browseMedia(currentPath, {
				type: "image",
				search: debouncedSearch || undefined,
			}),
		enabled: opened,
		placeholderData: (prev) => prev, // hasil lama tetap terlihat saat refetch
	});

	// File `pending` = upload multipart yang belum selesai, isinya belum utuh.
	const files = (data?.files ?? []).filter((f) => f.status === "ready");
	// Saat mencari, daftar folder tak relevan karena hasil lintas folder.
	const folders = isSearching ? [] : (data?.folders ?? []);

	const handleClose = () => {
		setSearch(""); // jangan sisakan query lama saat modal dibuka lagi.
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title="Media Library"
			size="lg"
			centered
		>
			<MediaBreadcrumb currentPath={currentPath} onNavigate={setCurrentPath} />

			<TextInput
				placeholder="Cari gambar..."
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => setSearch(e.currentTarget.value)}
				mb="md"
			/>

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
					{isSearching
						? "Tidak ada gambar yang cocok."
						: "Belum ada gambar di folder ini."}
				</Text>
			) : (
				<Stack gap="lg">
					{/* Folders — dikelompokkan terpisah, seperti di Media Library. */}
					{folders.length > 0 && (
						<Stack gap="sm">
							<Text fw={600} size="sm">
								Folders ({folders.length})
							</Text>
							<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
								{folders.map((folder) => (
									<UnstyledButton
										key={folder.id}
										onClick={() => setCurrentPath(folder.path)}
										title={folder.name}
										style={{
											borderRadius: 8,
											border: "1px solid var(--mantine-color-yellow-3)",
											backgroundColor: "var(--mantine-color-yellow-0)",
											padding: 12,
										}}
									>
										<Stack gap={6} align="center" justify="center" h={120}>
											<IconFolder
												size={40}
												color="var(--mantine-color-yellow-6)"
												fill="var(--mantine-color-yellow-4)"
											/>
											<Text size="xs" ta="center" lineClamp={2}>
												{folder.name}
											</Text>
										</Stack>
									</UnstyledButton>
								))}
							</SimpleGrid>
						</Stack>
					)}

					{/* Files — kelompok terpisah dari folder. */}
					{files.length > 0 && (
						<Stack gap="sm">
							<Text fw={600} size="sm">
								Files ({files.length})
							</Text>
							<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
								{files.map((file) => (
									<UnstyledButton
										key={file.id}
										onClick={() => {
											onSelect(file);
											handleClose();
										}}
										title={file.name}
										style={{
											borderRadius: 8,
											overflow: "hidden",
											border: "1px solid var(--mantine-color-gray-3)",
										}}
									>
										<Stack gap={0}>
											<Image
												src={getMediaPreviewUrl(file)}
												h={120}
												fit="cover"
												alt={file.altText ?? file.name}
											/>
											<Text size="xs" ta="center" lineClamp={1} px={6} py={4}>
												{file.name}
											</Text>
										</Stack>
									</UnstyledButton>
								))}
							</SimpleGrid>
						</Stack>
					)}
				</Stack>
			)}
		</Modal>
	);
}
