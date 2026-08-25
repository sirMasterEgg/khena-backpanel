import { Stack, Text } from "@mantine/core";
import { LandingSectionCard } from "./LandingSectionCard";
import type { LandingSection, LandingSectionKey } from "./landingTypes";

interface LandingSectionsListProps {
	sections: LandingSection[];
	onEdit: (key: LandingSectionKey) => void;
	onTogglePublish: (key: LandingSectionKey) => void;
	/** `page.update` tidak dimiliki user — tombol Publish/Edit di-disabled. */
	canEdit?: boolean;
	/** Ada toggle publish yang sedang berjalan — cegah klik ganda. */
	isToggling?: boolean;
}

export function LandingSectionsList({
	sections,
	onEdit,
	onTogglePublish,
	canEdit = true,
	isToggling = false,
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
						disabled={!canEdit || isToggling}
					/>
				))}
			</Stack>
		</>
	);
}
