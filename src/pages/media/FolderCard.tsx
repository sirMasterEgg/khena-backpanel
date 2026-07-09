import { ActionIcon, Card, Group, Menu, Stack, Text } from "@mantine/core";
import { IconBookmark, IconDots } from "@tabler/icons-react";
import type { MediaFolder } from "@/data/dummy";

interface FolderCardProps {
	folder: MediaFolder;
	fileCount: number;
	onOpen: () => void;
	onRename: () => void;
	onDelete: () => void;
}

export function FolderCard({
	folder,
	fileCount,
	onOpen,
	onRename,
	onDelete,
}: FolderCardProps) {
	return (
		<Card
			withBorder
			padding="sm"
			style={{ cursor: "pointer" }}
			onClick={onOpen}
		>
			<Group justify="space-between" wrap="nowrap">
				<Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
					<IconBookmark size={20} />
					<Stack gap={0} style={{ minWidth: 0 }}>
						<Text size="sm" fw={500} truncate>
							{folder.name}
						</Text>
						<Text size="xs" c="dimmed">
							{fileCount} files
						</Text>
					</Stack>
				</Group>
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
						<Menu.Item onClick={onRename}>Rename</Menu.Item>
						<Menu.Item color="red" onClick={onDelete}>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>
		</Card>
	);
}
