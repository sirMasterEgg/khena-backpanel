import {
	ActionIcon,
	Group,
	Pill,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react";
import type { MediaCategory } from "@/data/dummy";

interface CategoryPanelProps {
	categories: MediaCategory[];
	/** Jumlah file per kategori, dipetakan dengan key = categoryId. */
	countByCategory: Record<number, number>;
	activeCategoryId: number | null;
	onSelectCategory: (id: number | null) => void;
	/** Nama kategori induk folder yang sedang dibuka; null bila tidak di dalam folder. */
	openFolderCategoryName: string | null;
	onBack: () => void;
	onDeleteFolder: () => void;
}

export function CategoryPanel({
	categories,
	countByCategory,
	activeCategoryId,
	onSelectCategory,
	openFolderCategoryName,
	onBack,
	onDeleteFolder,
}: CategoryPanelProps) {
	return (
		<Stack gap="sm">
			<Text size="xs" fw={600} c="dimmed">
				CATEGORIES
			</Text>

			<Stack gap={2}>
				{categories.map((category) => {
					const active = activeCategoryId === category.id;
					return (
						<UnstyledButton
							key={category.id}
							onClick={() => onSelectCategory(active ? null : category.id)}
							p="xs"
							style={{
								borderRadius: 8,
								backgroundColor: active
									? "var(--mantine-color-blue-light)"
									: undefined,
							}}
						>
							<Group justify="space-between" wrap="nowrap">
								<Text size="sm" fw={active ? 600 : 400} truncate>
									{category.name}
								</Text>
								<Pill size="sm" c="dimmed">
									{countByCategory[category.id] ?? 0}
								</Pill>
							</Group>
						</UnstyledButton>
					);
				})}
			</Stack>

			{openFolderCategoryName && (
				<Group justify="space-between" wrap="nowrap">
					<UnstyledButton onClick={onBack}>
						<Group gap={4} wrap="nowrap">
							<IconArrowLeft size={16} />
							<Text size="sm" truncate>
								Back to {openFolderCategoryName}
							</Text>
						</Group>
					</UnstyledButton>
					<ActionIcon
						variant="subtle"
						color="red"
						onClick={onDeleteFolder}
						aria-label="Delete folder"
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Group>
			)}
		</Stack>
	);
}
