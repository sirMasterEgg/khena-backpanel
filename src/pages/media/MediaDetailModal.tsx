import {
	Button,
	Grid,
	Group,
	Image,
	Modal,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconCopy, IconDownload, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { getMediaPreviewUrl, type MediaFile } from "@/api/media";
import { formatSize } from "./format";

/** Batas alt text di API (contract.md bagian 7) — dijaga juga di input. */
const ALT_TEXT_MAX_LENGTH = 1000;

interface MediaDetailModalProps {
	file: MediaFile | null;
	folderPath: string;
	onClose: () => void;
	onSaveAltText: (id: string, value: string) => void;
	onCopyUrl: (url: string) => void;
	onDownload: (file: MediaFile) => void;
	onDelete: (id: string) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<Group justify="space-between" wrap="nowrap" gap="md">
			<Text size="sm" c="dimmed">
				{label}
			</Text>
			<Text size="sm" fw={500} ta="right" style={{ wordBreak: "break-word" }}>
				{value}
			</Text>
		</Group>
	);
}

export function MediaDetailModal({
	file,
	folderPath,
	onClose,
	onSaveAltText,
	onCopyUrl,
	onDownload,
	onDelete,
}: MediaDetailModalProps) {
	// Alt text ditahan di state lokal supaya tidak ada request per ketikan;
	// pengirimannya sekali saja saat modal ditutup.
	const [altText, setAltText] = useState("");

	// Identitas nilai yang sedang ditampilkan: ikut berubah saat pindah file
	// maupun saat server mengembalikan alt text baru.
	const savedAltText = file?.altText ?? "";
	const fileKey = file ? `${file.id}:${savedAltText}` : null;
	const [syncedKey, setSyncedKey] = useState<string | null>(null);

	// Reset state saat props berubah — pola "adjusting state during render",
	// lebih tepat daripada useEffect karena tidak menyebabkan render kedua.
	if (fileKey !== syncedKey) {
		setSyncedKey(fileKey);
		setAltText(savedAltText);
	}

	const handleClose = () => {
		// Simpan hanya kalau memang berubah, supaya menutup modal tanpa mengedit
		// tidak menembakkan PATCH sama sekali.
		if (file && altText !== savedAltText) {
			onSaveAltText(file.id, altText);
		}
		onClose();
	};

	return (
		<Modal
			opened={file !== null}
			onClose={handleClose}
			title={file?.name ?? "File details"}
			size="lg"
			centered
		>
			{file && (
				<Stack gap="md">
					<Grid gap="md">
						{/* Pratinjau besar */}
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<Image
								src={getMediaPreviewUrl(file)}
								radius="md"
								fit="contain"
								alt={file.altText ?? file.name}
							/>
						</Grid.Col>

						{/* Detail + alt text */}
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<Stack gap="xs">
								<DetailRow label="File name" value={file.name} />
								<DetailRow label="Type" value={file.type} />
								<DetailRow label="Mime type" value={file.mimeType} />
								<DetailRow label="Size" value={formatSize(file.sizeBytes)} />
								<DetailRow
									label="Dimensions"
									value={
										file.width && file.height
											? `${file.width} × ${file.height}`
											: "—"
									}
								/>
								<DetailRow label="Folder" value={folderPath} />
								<DetailRow
									label="Uploaded"
									value={dayjs(file.createdAt).format("DD MMM YYYY HH:mm")}
								/>
								<DetailRow label="ID" value={file.id} />
								<TextInput
									label="Alt text"
									placeholder="Describe this file"
									description="Perubahan disimpan saat modal ditutup."
									maxLength={ALT_TEXT_MAX_LENGTH}
									value={altText}
									onChange={(e) => setAltText(e.currentTarget.value)}
								/>
							</Stack>
						</Grid.Col>
					</Grid>

					{/* Footer */}
					<Group justify="flex-end" gap="sm">
						<Button
							variant="default"
							leftSection={<IconCopy size={16} />}
							onClick={() => onCopyUrl(getMediaPreviewUrl(file))}
						>
							Copy URL
						</Button>
						<Button
							variant="default"
							leftSection={<IconDownload size={16} />}
							onClick={() => onDownload(file)}
						>
							Download
						</Button>
						<Button
							color="red"
							leftSection={<IconTrash size={16} />}
							onClick={() => onDelete(file.id)}
						>
							Delete
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
}
