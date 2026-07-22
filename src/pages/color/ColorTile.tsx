import {
	ActionIcon,
	Box,
	Group,
	Menu,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { IconDots, IconLock, IconPencil, IconTrash } from "@tabler/icons-react";
import { withHash } from "@/api/colors";
import type { FinishColor } from "@/api/finishes";
import { getMediaPreviewUrl } from "@/api/media";

interface ColorTileProps {
	color: FinishColor;
	onEdit?: () => void;
	onDelete?: () => void;
	/** Color bawaan brand: tidak bisa diedit/dihapus, hanya ditampilkan. */
	locked?: boolean;
}

export function ColorTile({ color, onEdit, onDelete, locked }: ColorTileProps) {
	// `swatchPhoto` null = media-nya sudah di-soft-delete. Kondisi normal, bukan
	// error — color tetap tampil, cukup jatuh ke warna hexCode-nya.
	const swatchUrl = color.swatchPhoto
		? getMediaPreviewUrl(color.swatchPhoto)
		: undefined;

	return (
		<Box
			p="md"
			style={{
				border: "1px solid #ddd",
				borderRadius: 4,
			}}
		>
			<Group justify="space-between" align="center" wrap="nowrap">
				<Group gap="sm" align="center" flex={1}>
					<Box
						style={{
							width: 28,
							height: 28,
							borderRadius: "50%",
							backgroundColor: withHash(color.hexCode),
							backgroundImage: swatchUrl ? `url(${swatchUrl})` : undefined,
							backgroundSize: "cover",
							backgroundPosition: "center",
							border: "1px solid #ddd",
							flexShrink: 0,
						}}
					/>
					<Stack gap={0} flex={1}>
						<Text size="sm" fw={500}>
							{color.name}
						</Text>
						<Text size="xs" c="dimmed">
							{withHash(color.hexCode).toUpperCase()}
						</Text>
					</Stack>
				</Group>

				{!locked && (
					<Menu>
						<Menu.Target>
							<ActionIcon size="sm" variant="subtle">
								<IconDots size={14} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								leftSection={<IconPencil size={14} />}
								onClick={onEdit}
							>
								Edit color
							</Menu.Item>
							<Menu.Item
								leftSection={<IconTrash size={14} />}
								color="red"
								onClick={onDelete}
							>
								Delete color
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				)}
			</Group>
		</Box>
	);
}
