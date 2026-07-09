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
import type { MediaFile } from "@/data/dummy";
import { formatSize } from "./format";

interface MediaDetailModalProps {
	file: MediaFile | null;
	categoryName: string;
	folderName: string | null;
	onClose: () => void;
	onAltTextChange: (id: number, value: string) => void;
	onCopyUrl: (url: string) => void;
	onDownload: (file: MediaFile) => void;
	onDelete: (id: number) => void;
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
	categoryName,
	folderName,
	onClose,
	onAltTextChange,
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
								src={file.url}
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
								<DetailRow label="Size" value={formatSize(file.size)} />
								<DetailRow
									label="Dimensions"
									value={
										file.width && file.height
											? `${file.width} × ${file.height}`
											: "—"
									}
								/>
								<DetailRow label="Category" value={categoryName} />
								<DetailRow label="Folder" value={folderName ?? "—"} />
								<DetailRow label="Uploaded" value={file.uploadedAt} />
								<DetailRow label="ID" value={String(file.id)} />
								<TextInput
									label="Alt text"
									placeholder="Describe this file"
									value={file.altText ?? ""}
									onChange={(e) =>
										onAltTextChange(file.id, e.currentTarget.value)
									}
								/>
							</Stack>
						</Grid.Col>
					</Grid>

					{/* Footer */}
					<Group justify="flex-end" gap="sm">
						<Button
							variant="default"
							leftSection={<IconCopy size={16} />}
							onClick={() => onCopyUrl(file.url)}
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
							onClick={() => {
								onDelete(file.id);
								onClose();
							}}
						>
							Delete
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
}
