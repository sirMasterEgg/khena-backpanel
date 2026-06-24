import {
	ActionIcon,
	Box,
	Button,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { IconLock, IconPlus, IconTrash } from "@tabler/icons-react";
import type { Color, MaterialType } from "@/data/dummy";
import { ColorTile } from "./ColorTile";

interface MaterialTypeCardProps {
	material: MaterialType;
	onAddColor: () => void;
	onEditColor: (color: Color) => void;
	onDeleteColor: (colorId: number) => void;
	onDeleteMaterial: () => void;
}

export function MaterialTypeCard({
	material,
	onAddColor,
	onEditColor,
	onDeleteColor,
	onDeleteMaterial,
}: MaterialTypeCardProps) {
	const isLocked = material.locked ?? false;

	return (
		<Card withBorder mb="md">
			<Stack gap="md">
				<Group justify="space-between">
					<Text fw={600}>
						{isLocked
							? "Brand"
							: `${material.name} (${material.colors.length})`}
					</Text>
					{isLocked ? (
						<Group gap="xs">
							<IconLock size={16} />
							<Text size="sm">Locked</Text>
						</Group>
					) : (
						<Group gap="xs">
							<Button
								leftSection={<IconPlus size={16} />}
								size="sm"
								onClick={onAddColor}
							>
								Add color
							</Button>
							<ActionIcon
								color="red"
								variant="light"
								size="sm"
								onClick={onDeleteMaterial}
							>
								<IconTrash size={16} />
							</ActionIcon>
						</Group>
					)}
				</Group>

				{material.colors.length === 0 && !isLocked ? (
					<Box
						p="md"
						style={{
							border: "1px dashed #ccc",
							borderRadius: 4,
							textAlign: "center",
						}}
					>
						<Text c="dimmed" size="sm">
							No colors yet. Click 'Add color' to get started.
						</Text>
					</Box>
				) : material.colors.length > 0 ? (
					<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
						{material.colors.map((color) => (
							<ColorTile
								key={color.id}
								color={color}
								variant={isLocked ? "brand" : "category"}
								onEdit={() => onEditColor(color)}
								onDelete={() => onDeleteColor(color.id)}
							/>
						))}
					</SimpleGrid>
				) : null}
			</Stack>
		</Card>
	);
}
