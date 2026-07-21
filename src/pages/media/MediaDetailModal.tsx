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
	savingAltText: boolean;
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

/**
 * Editor alt text dengan state lokal — sengaja tidak mengirim request per
 * ketikan; penyimpanan hanya lewat tombol eksplisit.
 */
function AltTextField({
	savedValue,
	saving,
	onSave,
}: {
	savedValue: string;
	saving: boolean;
	onSave: (value: string) => void;
}) {
	const [value, setValue] = useState(savedValue);

	return (
		<>
			<TextInput
				label="Alt text"
				placeholder="Describe this file"
				maxLength={ALT_TEXT_MAX_LENGTH}
				value={value}
				onChange={(e) => setValue(e.currentTarget.value)}
			/>
			<Button
				type="button"
				variant="light"
				disabled={value === savedValue}
				loading={saving}
				onClick={() => onSave(value)}
			>
				Save alt text
			</Button>
		</>
	);
}

export function MediaDetailModal({
	file,
	folderPath,
	savingAltText,
	onClose,
	onSaveAltText,
	onCopyUrl,
	onDownload,
	onDelete,
}: MediaDetailModalProps) {
	return (
		<Modal
			opened={file !== null}
			onClose={onClose}
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
								{/* `key` memaksa state lokal di-reset saat pindah file atau
								    saat server mengembalikan alt text baru. */}
								<AltTextField
									key={`${file.id}:${file.altText ?? ""}`}
									savedValue={file.altText ?? ""}
									saving={savingAltText}
									onSave={(value) => onSaveAltText(file.id, value)}
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
