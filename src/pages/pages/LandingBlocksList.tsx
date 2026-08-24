import { Card, Stack, Text } from "@mantine/core";
import type { LandingBlock } from "@/data/dummy";
import { LandingBlockCard } from "./LandingBlockCard";

interface LandingBlocksListProps {
	blocks: LandingBlock[];
	onEdit: (id: string) => void;
	onTogglePublish: (id: string) => void;
}

export function LandingBlocksList({
	blocks,
	onEdit,
	onTogglePublish,
}: LandingBlocksListProps) {
	if (blocks.length === 0) {
		return (
			<Card withBorder>
				<Text c="dimmed" ta="center" py="xl">
					No blocks yet
				</Text>
			</Card>
		);
	}

	return (
		<>
			<Text size="sm" c="dimmed" mb="md">
				The landing page is built from the blocks below. Edit a block to change
				what visitors see first.
			</Text>
			<Stack gap="md">
				{blocks.map((block) => (
					<LandingBlockCard
						key={block.id}
						block={block}
						onEdit={onEdit}
						onTogglePublish={onTogglePublish}
					/>
				))}
			</Stack>
		</>
	);
}
