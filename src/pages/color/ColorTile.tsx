import { ActionIcon, Box, Group, Menu, Stack, Text } from "@mantine/core";
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import type { Color } from "@/data/dummy";

interface ColorTileProps {
	color: Color;
	variant: "brand" | "category";
	onEdit?: () => void;
	onDelete?: () => void;
}

export function ColorTile({
	color,
	variant,
	onEdit,
	onDelete,
}: ColorTileProps) {
	return (
		<Group justify="space-between" align="center" wrap="nowrap" mb="sm">
			<Group gap="sm" align="center" flex={1}>
				<Box
					style={{
						width: 28,
						height: 28,
						borderRadius: "50%",
						backgroundColor: color.hex,
						border: "1px solid #ddd",
						flexShrink: 0,
					}}
				/>
				<Stack gap={0} flex={1}>
					<Text size="sm" fw={500}>
						{color.name}
					</Text>
					<Text size="xs" c="dimmed">
						{color.hex}
					</Text>
				</Stack>
			</Group>

			{variant === "category" && (
				<Menu>
					<Menu.Target>
						<ActionIcon size="sm" variant="subtle">
							<IconDots size={14} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item leftSection={<IconPencil size={14} />} onClick={onEdit}>
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
	);
}
