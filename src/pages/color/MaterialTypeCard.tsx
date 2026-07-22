import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { IconLock, IconPlus, IconTrash } from "@tabler/icons-react";
import type { FinishColor, FinishWithColors } from "@/api/finishes";
import { ColorTile } from "./ColorTile";

interface MaterialTypeCardProps {
	/** "Material type" di UI = "Finish" di API. */
	finish: FinishWithColors;
	onAddColor?: () => void;
	onEditColor?: (color: FinishColor) => void;
	onDeleteColor?: (color: FinishColor) => void;
	onDeleteFinish?: () => void;
	/**
	 * Grup bawaan brand: read-only. Tanpa tombol tambah/hapus, dan tiap color
	 * tampil terkunci. Handler di atas diabaikan saat locked.
	 */
	locked?: boolean;
}

export function MaterialTypeCard({
	finish,
	onAddColor,
	onEditColor,
	onDeleteColor,
	onDeleteFinish,
	locked,
}: MaterialTypeCardProps) {
	// Backend menolak menghapus finish yang masih dipakai color aktif. Data
	// `colors` sudah di tangan dari GET /finishes, jadi guard-nya gratis.
	const hasColors = finish.colors.length > 0;

	return (
		<Card withBorder mb="md">
			<Stack gap="md">
				<Group justify="space-between">
					<Group gap="xs">
						<Text fw={600}>
							{finish.name} ({finish.colors.length})
						</Text>
					</Group>
					{locked ? (
						<Badge
							size="sm"
							variant="light"
							color="gray"
							leftSection={<IconLock size={12} />}
						>
							Locked
						</Badge>
					) : (
						<Group gap="xs">
							<Button
								leftSection={<IconPlus size={16} />}
								size="sm"
								onClick={onAddColor}
							>
								Add {finish.name} color
							</Button>
							<Tooltip
								label="Hapus semua color di dalamnya dulu"
								disabled={!hasColors}
							>
								{/* Tooltip butuh elemen yang tetap menerima event walau disabled. */}
								<Box>
									<ActionIcon
										color="red"
										variant="light"
										size="sm"
										disabled={hasColors}
										onClick={onDeleteFinish}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Box>
							</Tooltip>
						</Group>
					)}
				</Group>

				{finish.colors.length === 0 ? (
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
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
						{finish.colors.map((color) => (
							<ColorTile
								key={color.id}
								color={color}
								locked={locked}
								onEdit={() => onEditColor?.(color)}
								onDelete={() => onDeleteColor?.(color)}
							/>
						))}
					</SimpleGrid>
				)}
			</Stack>
		</Card>
	);
}
