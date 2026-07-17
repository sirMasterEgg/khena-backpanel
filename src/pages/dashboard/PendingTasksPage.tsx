import {
	Anchor,
	Avatar,
	Breadcrumbs,
	Button,
	Card,
	Container,
	Group,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowLeft,
	IconArrowRight,
	IconClock,
	IconFileText,
	IconMail,
} from "@tabler/icons-react";
import type { ComponentProps, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	getPendingTaskCategories,
	LOW_STOCK_THRESHOLD,
	type PendingTaskCategoryKey,
	type PendingTaskItem,
} from "./dashboardData";

/** Tipe status yang diterima StatusBadge — dipakai untuk mempersempit string. */
type BadgeStatus = ComponentProps<typeof StatusBadge>["status"];

/** Konfigurasi tampilan per kategori — sumber kebenaran untuk kartu ringkasan
 * dan kartu per-kategori supaya keduanya konsisten. Urutan mengikuti data. */
type CategoryConfig = {
	label: string;
	icon: ReactNode;
	color: string;
	ctaLabel: string;
	ctaTo: string;
	emptyMessage: string;
};

const categoryConfig: Record<PendingTaskCategoryKey, CategoryConfig> = {
	orders: {
		label: "Orders awaiting action",
		icon: <IconClock size={18} />,
		color: "yellow",
		ctaLabel: "Go to filtered orders",
		ctaTo: "/orders?status=pending",
		emptyMessage: "You have no orders waiting.",
	},
	outOfStock: {
		label: "Out of stock products",
		icon: <IconAlertTriangle size={18} />,
		color: "red",
		ctaLabel: "View out-of-stock products",
		ctaTo: "/stocks",
		emptyMessage: "Nothing is out of stock right now.",
	},
	lowStock: {
		label: `Running low (≤ ${LOW_STOCK_THRESHOLD} units)`,
		icon: <IconAlertTriangle size={18} />,
		color: "orange",
		ctaLabel: "View low inventory",
		ctaTo: "/stocks",
		emptyMessage: "Inventory levels look healthy.",
	},
	unread: {
		label: "Unread customer messages",
		icon: <IconMail size={18} />,
		color: "blue",
		ctaLabel: "Open unread inbox",
		ctaTo: "/messages",
		emptyMessage: "No unread messages.",
	},
	drafts: {
		label: "Draft products",
		icon: <IconFileText size={18} />,
		color: "gray",
		ctaLabel: "Manage drafts",
		ctaTo: "/products?status=draft",
		emptyMessage: "No draft products.",
	},
};

function scrollToCategory(key: PendingTaskCategoryKey) {
	document
		.getElementById(`cat-${key}`)
		?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Satu baris item di dalam kartu kategori. Pola dari RecentOrdersCard. */
function PendingItemRow({
	item,
	config,
}: {
	item: PendingTaskItem;
	config: CategoryConfig;
}) {
	const navigate = useNavigate();

	return (
		<UnstyledButton
			onClick={() => navigate(item.to)}
			p="xs"
			style={{ borderRadius: "var(--mantine-radius-sm)" }}
		>
			<Group wrap="nowrap" justify="space-between">
				<Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
					{item.thumbnail ? (
						<Avatar src={item.thumbnail} size={40} radius="sm" />
					) : (
						<ThemeIcon
							variant="light"
							color={config.color}
							size={40}
							radius="sm"
						>
							{config.icon}
						</ThemeIcon>
					)}
					<Stack gap={2} style={{ minWidth: 0 }}>
						<Text size="sm" fw={500} truncate>
							{item.primary}
						</Text>
						<Text size="xs" c="dimmed" truncate>
							{item.secondary}
						</Text>
					</Stack>
				</Group>
				<Group wrap="nowrap" gap="sm" style={{ flexShrink: 0 }}>
					{item.status && (
						<StatusBadge status={item.status as BadgeStatus} size="sm" />
					)}
					{item.value && (
						<Text size="sm" fw={600} style={{ whiteSpace: "nowrap" }}>
							{item.value}
						</Text>
					)}
				</Group>
			</Group>
		</UnstyledButton>
	);
}

export function PendingTasksPage() {
	usePageTitle("Pending Tasks");

	const categories = getPendingTaskCategories();
	const totalItems = categories.reduce((sum, cat) => sum + cat.count, 0);
	const activeCategories = categories.filter((cat) => cat.count > 0).length;

	const subtitle =
		totalItems > 0
			? `${totalItems} items across ${activeCategories} categories need attention`
			: "You're all caught up — nothing needs attention right now.";

	return (
		<Container size="xl" px="0">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor component={Link} to="/" size="sm">
					Dashboard
				</Anchor>
				<Text size="sm" c="dimmed">
					Pending Tasks
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Pending Tasks"
				subtitle={subtitle}
				actions={
					<Button
						component={Link}
						to="/"
						variant="default"
						leftSection={<IconArrowLeft size={16} />}
					>
						Back to dashboard
					</Button>
				}
			/>

			{/* Baris kartu ringkasan — klik → scroll ke kartu kategori. */}
			<SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} mb="xl">
				{categories.map((cat) => {
					const config = categoryConfig[cat.key];
					return (
						<UnstyledButton
							key={cat.key}
							onClick={() => scrollToCategory(cat.key)}
							style={{ width: "100%" }}
						>
							<Card withBorder h="100%" style={{ cursor: "pointer" }}>
								<Group wrap="nowrap" gap="sm">
									<ThemeIcon variant="light" color={config.color} size="lg">
										{config.icon}
									</ThemeIcon>
									<Text
										size="sm"
										fw={500}
										style={{ minWidth: 0 }}
										lineClamp={2}
									>
										{config.label}
									</Text>
								</Group>
								<Text fw={700} size="xl" mt="sm">
									{cat.count}
								</Text>
							</Card>
						</UnstyledButton>
					);
				})}
			</SimpleGrid>

			{/* Kartu per-kategori. */}
			<Stack gap="md">
				{categories.map((cat) => {
					const config = categoryConfig[cat.key];
					const remaining = cat.count - cat.items.length;
					return (
						<Card key={cat.key} withBorder id={`cat-${cat.key}`}>
							<Card.Section inheritPadding py="md">
								<Group justify="space-between" wrap="nowrap">
									<Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
										<ThemeIcon variant="light" color={config.color} size="lg">
											{config.icon}
										</ThemeIcon>
										<Stack gap={0} style={{ minWidth: 0 }}>
											<Text fw={600} truncate>
												{config.label}
											</Text>
											{cat.count > 0 && (
												<Text size="xs" c="dimmed">
													{cat.count} {cat.count === 1 ? "item" : "items"}
												</Text>
											)}
										</Stack>
									</Group>
									<Button
										component={Link}
										to={config.ctaTo}
										variant="light"
										size="xs"
										rightSection={<IconArrowRight size={16} />}
										style={{ flexShrink: 0 }}
									>
										{config.ctaLabel}
									</Button>
								</Group>
							</Card.Section>

							<Card.Section inheritPadding pb="md">
								{cat.items.length === 0 ? (
									<Text c="dimmed" fs="italic" ta="center" py="lg">
										{config.emptyMessage}
									</Text>
								) : (
									<Stack gap="xs">
										{cat.items.map((item) => (
											<PendingItemRow
												key={item.id}
												item={item}
												config={config}
											/>
										))}
										{remaining > 0 && (
											<Anchor
												component={Link}
												to={config.ctaTo}
												size="sm"
												pl="xs"
											>
												+ {remaining} more
											</Anchor>
										)}
									</Stack>
								)}
							</Card.Section>
						</Card>
					);
				})}
			</Stack>
		</Container>
	);
}
