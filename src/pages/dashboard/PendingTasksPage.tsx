import {
	Alert,
	Anchor,
	Avatar,
	Breadcrumbs,
	Button,
	Card,
	Container,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import {
	IconAlertCircle,
	IconAlertTriangle,
	IconArrowLeft,
	IconArrowRight,
	IconClock,
	IconFileText,
	IconMail,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { ComponentProps, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import type { DashboardPending } from "@/api/dashboard";
import { getDashboardPending } from "@/api/dashboard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import { formatIDR } from "@/utils/format";

/** Tipe status yang diterima StatusBadge — dipakai untuk mempersempit string. */
type BadgeStatus = ComponentProps<typeof StatusBadge>["status"];

/** Maksimal baris item yang ditampilkan per kategori sebelum "+ N more". */
const MAX_PENDING_ITEMS = 8;

/** Satu baris item yang sudah dinormalisasi supaya komponen gampang me-render. */
type PendingTaskItem = {
	id: string; // key unik lintas kategori, mis. order.id atau `product-${id}`
	/** Cuma dikirim API untuk kategori stok (outOfStock/lowStock); kategori
	 * lain tidak punya gambar → komponen fallback ke ThemeIcon kategori. */
	thumbnail?: string;
	primary: string; // teks utama (baris atas)
	secondary: string; // keterangan (baris bawah)
	status?: string; // untuk StatusBadge (mis. "pending", "outofstock", "unread")
	value?: string; // nilai di ujung kanan (mis. total order)
	to: string; // route saat baris diklik
};

type PendingTaskCategoryKey =
	| "orders"
	| "outOfStock"
	| "lowStock"
	| "unread"
	| "drafts";

type PendingTaskCategory = {
	key: PendingTaskCategoryKey;
	count: number; // TOTAL sebenarnya (bucket.total), bukan cuma yang tampil
	items: PendingTaskItem[]; // sudah dipotong maksimal MAX_PENDING_ITEMS
};

/** Petakan response GET /dashboard/pending ke 5 kategori berurutan. */
function toCategories(data: DashboardPending): PendingTaskCategory[] {
	const orders: PendingTaskCategory = {
		key: "orders",
		count: data.orderAwaitingAction.total,
		items: data.orderAwaitingAction.items.map((o) => ({
			id: o.id,
			primary: `${o.invoiceNumber} · ${o.customerName ?? "Guest"}`,
			secondary: `${o.status} · ${o.orderDate}`,
			status: o.status,
			value: formatIDR(o.total),
			to: `/orders/${o.id}`,
		})),
	};

	const outOfStock: PendingTaskCategory = {
		key: "outOfStock",
		count: data.outOfStockProducts.total,
		items: data.outOfStockProducts.items.map((p) => ({
			id: `product-${p.detailProductId}`,
			thumbnail: p.imageUrl ?? undefined,
			primary: p.productName,
			secondary: `${p.sku} · out of stock`,
			status: "outofstock",
			to: "/stocks",
		})),
	};

	const lowStock: PendingTaskCategory = {
		key: "lowStock",
		count: data.lowStockProducts.total,
		items: data.lowStockProducts.items.map((p) => ({
			id: `product-${p.detailProductId}`,
			thumbnail: p.imageUrl ?? undefined,
			primary: p.productName,
			secondary: `${p.sku} · ${p.quantity} left (alert at ${p.minStockAlert ?? "—"})`,
			status: "lowstock",
			to: "/stocks",
		})),
	};

	const unread: PendingTaskCategory = {
		key: "unread",
		count: data.unreadMessages.total,
		items: data.unreadMessages.items.map((m) => ({
			id: `contact-${m.id}`,
			primary: m.subject,
			secondary: `From ${m.name} · ${dayjs(m.createdAt).format("MMM D, YYYY")}`,
			status: "unread",
			to: "/messages",
		})),
	};

	const drafts: PendingTaskCategory = {
		key: "drafts",
		count: data.draftProducts.total,
		items: data.draftProducts.items.map((p) => ({
			id: `product-${p.id}`,
			primary: p.name,
			secondary: `${p.baseSku} · updated ${dayjs(p.updatedAt).format("MMM D, YYYY")}`,
			status: "draft",
			to: `/products/${p.id}/edit`,
		})),
	};

	return [orders, outOfStock, lowStock, unread, drafts];
}

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
		label: "Running low",
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

	const { can } = usePermissions();
	const canRead = can("dashboard.read");

	const pendingQuery = useQuery({
		queryKey: ["dashboard", "pending", { limit: MAX_PENDING_ITEMS }],
		queryFn: () => getDashboardPending(MAX_PENDING_ITEMS),
		enabled: canRead,
	});

	if (!canRead) {
		return (
			<Container size="xl" px="0">
				<Text c="dimmed">You don't have access to the dashboard.</Text>
			</Container>
		);
	}

	const categories = pendingQuery.data ? toCategories(pendingQuery.data) : [];
	const totalItems = categories.reduce((sum, cat) => sum + cat.count, 0);
	const activeCategories = categories.filter((cat) => cat.count > 0).length;

	const subtitle = pendingQuery.isLoading
		? " "
		: totalItems > 0
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

			{pendingQuery.isError && (
				<Alert
					icon={<IconAlertCircle size={16} />}
					color="red"
					mb="md"
					title="Failed to load pending tasks"
				>
					{getApiErrorMessage(pendingQuery.error)}
				</Alert>
			)}

			{pendingQuery.isLoading ? (
				<Stack gap="md">
					<SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }}>
						{Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows, no stable id
							<Skeleton key={i} h={92} radius="sm" />
						))}
					</SimpleGrid>
					<Skeleton h={200} radius="sm" />
					<Skeleton h={200} radius="sm" />
				</Stack>
			) : (
				<>
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
												<ThemeIcon
													variant="light"
													color={config.color}
													size="lg"
												>
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
				</>
			)}
		</Container>
	);
}
