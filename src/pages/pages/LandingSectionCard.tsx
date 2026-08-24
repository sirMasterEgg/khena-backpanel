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
import type { LandingSection, LandingSectionKey } from "@/data/dummy";
import { DESIGNED_FOR_LIFE_PRODUCT_COUNT } from "./designedForLifeSchema";
import { formatUpdatedAt } from "./format";

interface LandingSectionCardProps {
	section: LandingSection;
	onEdit: (key: LandingSectionKey) => void;
	onTogglePublish: (key: LandingSectionKey) => void;
}

/** Badge tipe section, mis. "Hero", "Carousel · 3 slides". */
function typeBadgeLabel(section: LandingSection) {
	switch (section.kind) {
		case "hero":
			return "Hero";
		case "signature":
			return "Image";
		case "craftmanship":
			return `Carousel · ${section.slides.length} slides`;
		case "productGrid":
			return "Products";
	}
}

/** Thumbnail per kind — productGrid tidak punya gambar. */
function thumbnailUrl(section: LandingSection) {
	switch (section.kind) {
		case "hero":
		case "signature":
			return section.image.url;
		case "craftmanship":
			return section.slides[0]?.image.url;
		case "productGrid":
			return null;
	}
}

export function LandingSectionCard({
	section,
	onEdit,
	onTogglePublish,
}: LandingSectionCardProps) {
	// Cegah klik tombol ikut membuka editor (kartu punya onClick sendiri).
	const stop = (fn: () => void) => (e: MouseEvent) => {
		e.stopPropagation();
		fn();
	};

	const thumb = thumbnailUrl(section);

	return (
		<Card
			withBorder
			onClick={() => onEdit(section.key)}
			style={{ cursor: "pointer" }}
		>
			<Grid>
				{/* KOLOM KIRI — preview gambar */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<div style={{ position: "relative", height: "100%", minHeight: 160 }}>
						{thumb ? (
							<Image src={thumb} radius="sm" h="100%" mih={160} fit="cover" />
						) : (
							<Stack
								align="center"
								justify="center"
								h="100%"
								mih={160}
								bg="gray.1"
								style={{ borderRadius: "var(--mantine-radius-sm)" }}
							>
								<Text c="dimmed" size="sm">
									Products
								</Text>
							</Stack>
						)}
						{section.status === "draft" && (
							<Badge
								color="gray"
								style={{ position: "absolute", top: 8, left: 8 }}
							>
								● Draft
							</Badge>
						)}
					</div>
				</Grid.Col>

				{/* KOLOM KANAN — detail */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Group justify="space-between" align="flex-start">
						<Stack gap={2}>
							<Text size="xs" c="dimmed" tt="uppercase">
								{typeBadgeLabel(section)}
							</Text>
							<Text fw={600}>{section.label}</Text>
						</Stack>
						<Group gap="xs">
							<Button
								size="xs"
								variant="light"
								onClick={stop(() => onTogglePublish(section.key))}
							>
								{section.status === "published" ? "Unpublish" : "Publish"}
							</Button>
							<Button
								size="xs"
								variant="default"
								onClick={stop(() => onEdit(section.key))}
							>
								Edit section
							</Button>
						</Group>
					</Group>

					{section.kind === "hero" && (
						<>
							<Text size="xs" c="dimmed" mt="md">
								{section.subtitle}
							</Text>
							<Text size="sm">{section.title}</Text>
						</>
					)}
					{section.kind === "signature" && (
						<Text size="sm" mt="md">
							{section.title}
						</Text>
					)}
					{section.kind === "craftmanship" && (
						<Text size="sm" mt="md">
							{section.slides.length} slides · {section.ctaText}
						</Text>
					)}
					{section.kind === "productGrid" && (
						<Group gap="xs" mt="md">
							<Text size="sm">
								{section.productIds.length} of {DESIGNED_FOR_LIFE_PRODUCT_COUNT}{" "}
								products selected
							</Text>
							{section.productIds.length !==
								DESIGNED_FOR_LIFE_PRODUCT_COUNT && (
								<Text size="sm" c="orange">
									needs {DESIGNED_FOR_LIFE_PRODUCT_COUNT} products
								</Text>
							)}
						</Group>
					)}

					<Text size="xs" c="dimmed" mt="md">
						{formatUpdatedAt(section.updatedAt)}
					</Text>
				</Grid.Col>
			</Grid>
		</Card>
	);
}
