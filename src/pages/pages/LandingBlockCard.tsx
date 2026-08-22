import {
	Badge,
	Button,
	Card,
	Grid,
	Group,
	Image,
	Stack,
	Text,
} from "@mantine/core";
import type { MouseEvent } from "react";
import type { LandingBlock } from "@/data/dummy";
import { formatUpdatedAt } from "./format";

interface LandingBlockCardProps {
	block: LandingBlock;
	onEdit: (id: string) => void;
	onTogglePublish: (id: string) => void;
}

export function LandingBlockCard({
	block,
	onEdit,
	onTogglePublish,
}: LandingBlockCardProps) {
	// Cegah klik tombol ikut membuka editor (kartu punya onClick sendiri).
	const stop = (fn: () => void) => (e: MouseEvent) => {
		e.stopPropagation();
		fn();
	};

	return (
		<Card
			withBorder
			onClick={() => onEdit(block.id)}
			style={{ cursor: "pointer" }}
		>
			<Grid>
				{/* KOLOM KIRI — preview media */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<div style={{ position: "relative", height: "100%", minHeight: 160 }}>
						<Image
							src={block.mediaUrl}
							radius="sm"
							h="100%"
							mih={160}
							fit="cover"
						/>
						<Group gap="xs" style={{ position: "absolute", top: 8, left: 8 }}>
							{block.isVideo && <Badge color="dark">Video</Badge>}
							{block.type === "carousel" && (
								<Badge color="dark">
									Carousel · {block.slideCount} slides ·{" "}
									{block.slideDurationSec}s
								</Badge>
							)}
							{block.status === "draft" && <Badge color="gray">● Draft</Badge>}
						</Group>
					</div>
				</Grid.Col>

				{/* KOLOM KANAN — detail */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Group justify="space-between" align="flex-start">
						<Stack gap={2}>
							<Text size="xs" c="dimmed" tt="uppercase">
								{block.type === "hero" ? "Hero block" : "Carousel block"}
							</Text>
							<Text fw={600}>{block.name}</Text>
						</Stack>
						<Group gap="xs">
							<Button
								size="xs"
								variant="light"
								onClick={stop(() => onTogglePublish(block.id))}
							>
								{block.status === "published" ? "Unpublish" : "Publish"}
							</Button>
							<Button
								size="xs"
								variant="default"
								onClick={stop(() => onEdit(block.id))}
							>
								Edit block
							</Button>
						</Group>
					</Group>

					<Text size="xs" c="dimmed" tt="uppercase" mt="md">
						Headline
					</Text>
					<Text size="sm">{block.headline}</Text>

					<Text size="xs" c="dimmed" tt="uppercase" mt="md">
						Button
					</Text>
					<Group gap="xs">
						<Badge variant="light">{block.buttonLabel}</Badge>
						{block.buttonDestination ? (
							<Text size="sm" c="dimmed">
								{block.buttonDestination}
							</Text>
						) : (
							<Text size="sm" c="orange">
								no destination set
							</Text>
						)}
					</Group>

					<Text size="xs" c="dimmed" mt="md">
						{formatUpdatedAt(block.updatedAt)}
					</Text>
				</Grid.Col>
			</Grid>
		</Card>
	);
}
