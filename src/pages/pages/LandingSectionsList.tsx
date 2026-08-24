import { Stack, Text } from "@mantine/core";
import type { LandingSection, LandingSectionKey } from "@/data/dummy";
import { LandingSectionCard } from "./LandingSectionCard";

interface LandingSectionsListProps {
	sections: LandingSection[];
	onEdit: (key: LandingSectionKey) => void;
	onTogglePublish: (key: LandingSectionKey) => void;
}

export function LandingSectionsList({
	sections,
	onEdit,
	onTogglePublish,
}: LandingSectionsListProps) {
	return (
		<>
			<Text size="sm" c="dimmed" mb="md">
				The landing page is built from the fixed sections below. Edit a section
				to change what visitors see.
			</Text>
			<Stack gap="md">
				{sections.map((section) => (
					<LandingSectionCard
						key={section.key}
						section={section}
						onEdit={onEdit}
						onTogglePublish={onTogglePublish}
					/>
				))}
			</Stack>
		</>
	);
}
