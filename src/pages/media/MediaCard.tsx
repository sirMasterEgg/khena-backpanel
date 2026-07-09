import {
	ActionIcon,
	Box,
	Card,
	Group,
	Image,
	Menu,
	Stack,
	Text,
} from "@mantine/core";
import { IconDots, IconPlayerPlayFilled } from "@tabler/icons-react";
import type { MediaFile } from "@/data/dummy";
import { formatSize } from "./format";

interface MediaCardProps {
	file: MediaFile;
	onOpenDetail: () => void;
	onCopyUrl: () => void;
	onDownload: () => void;
	onDelete: () => void;
}

export function MediaCard({
	file,
	onOpenDetail,
	onCopyUrl,
	onDownload,
	onDelete,
}: MediaCardProps) {
	return (
		<Card
			withBorder
			padding={0}
			style={{ cursor: "pointer", overflow: "hidden" }}
			onClick={onOpenDetail}
		>
			{/* Pratinjau */}
			<Box style={{ position: "relative" }}>
				<Image
					src={file.url}
					h={140}
					fit="cover"
					alt={file.altText ?? file.name}
				/>
				{file.type === "video" && (
					<Box
						style={{
							position: "absolute",
							inset: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white",
							background: "rgba(0, 0, 0, 0.25)",
						}}
					>
						<IconPlayerPlayFilled size={32} />
					</Box>
				)}
			</Box>

			{/* Meta */}
			<Group justify="space-between" wrap="nowrap" p="xs">
				<Stack gap={0} style={{ minWidth: 0 }}>
					<Text size="sm" fw={500} truncate>
						{file.name}
					</Text>
					<Text size="xs" c="dimmed" truncate>
						{file.type} · {formatSize(file.size)} · {file.uploadedAt}
					</Text>
				</Stack>
				<Menu position="bottom-end">
					<Menu.Target>
						<ActionIcon
							size="sm"
							variant="subtle"
							onClick={(e) => e.stopPropagation()}
						>
							<IconDots size={14} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown onClick={(e) => e.stopPropagation()}>
						<Menu.Item onClick={onOpenDetail}>View details</Menu.Item>
						<Menu.Item onClick={onCopyUrl}>Copy URL</Menu.Item>
						<Menu.Item onClick={onDownload}>Download</Menu.Item>
						<Menu.Item color="red" onClick={onDelete}>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>
		</Card>
	);
}
