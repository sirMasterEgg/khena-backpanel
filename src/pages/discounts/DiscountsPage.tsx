import {
	ActionIcon,
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Menu,
	Stack,
	Table,
	Tabs,
	Text,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import {
	IconClockExclamation,
	IconCoin,
	IconCopy,
	IconDots,
	IconEdit,
	IconPlus,
	IconTicket,
	IconTrash,
	IconUsers,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { type Discount, dummyDiscounts } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	openAddDiscountModal,
	openEditDiscountModal,
} from "./DiscountEditorModal";
import {
	formatCurrency,
	formatDate,
	formatDiscountType,
	formatUsage,
} from "./format";

type DiscountsTab = "all" | "active" | "scheduled" | "expired";

/** Ambang "expiring soon": diskon aktif yang berakhir dalam ≤ 7 hari. */
const EXPIRING_SOON_DAYS = 7;

export function DiscountsPage() {
	usePageTitle("Discounts");
	const navigate = useNavigate();
	const clipboard = useClipboard({ timeout: 1500 });

	const [tab, setTab] = useState<DiscountsTab>("all");
	// Mirror data dummy di state supaya add/edit/delete bisa mengubah baris.
	const [discounts, setDiscounts] = useState<Discount[]>(() => [
		...dummyDiscounts,
	]);

	const stats = useMemo(() => {
		const active = discounts.filter((d) => d.status === "active");
		const redemptions = discounts.reduce((sum, d) => sum + d.used, 0);
		// Estimasi dummy: hanya diskon "fixed" yang punya nilai Rupiah pasti.
		const revenueImpact = discounts
			.filter((d) => d.type === "fixed")
			.reduce((sum, d) => sum + d.used * d.value, 0);
		const now = Date.now();
		const soonThreshold = now + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
		const expiringSoon = active.filter((d) => {
			const end = new Date(d.endDate).getTime();
			return end >= now && end <= soonThreshold;
		}).length;
		return {
			activeCodes: active.length,
			redemptions,
			revenueImpact,
			expiringSoon,
		};
	}, [discounts]);

	const counts = useMemo(
		() => ({
			all: discounts.length,
			active: discounts.filter((d) => d.status === "active").length,
			scheduled: discounts.filter((d) => d.status === "scheduled").length,
			expired: discounts.filter((d) => d.status === "expired").length,
		}),
		[discounts],
	);

	const visible = useMemo(
		() =>
			tab === "all" ? discounts : discounts.filter((d) => d.status === tab),
		[discounts, tab],
	);

	// ----- Handler -----

	const handleAdd = () =>
		openAddDiscountModal((d) => {
			// Mutasikan sumber dummy supaya konsisten dengan pola Purchasing/Customers.
			dummyDiscounts.unshift(d);
			setDiscounts([...dummyDiscounts]);
			notify.success(`${d.code} added`, "Discount added");
		});

	const handleEdit = (d: Discount) =>
		openEditDiscountModal(d, (updated) => {
			setDiscounts((prev) =>
				prev.map((x) => (x.id === updated.id ? updated : x)),
			);
			notify.success(`${updated.code} updated`, "Discount updated");
		});

	const handleCopy = (d: Discount) => {
		clipboard.copy(d.code);
		notify.success(`${d.code} copied to clipboard`, "Code copied");
	};

	const handleDelete = (d: Discount) => {
		setDiscounts((prev) => prev.filter((x) => x.id !== d.id));
		notify.success(`${d.code} deleted`, "Discount deleted");
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/discounts")}>
					Discounts
				</Anchor>
				<Text size="sm" c="dimmed">
					All Discounts
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Discounts"
				subtitle="Create and manage discount codes"
				actions={
					<Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
						Add Discount
					</Button>
				}
			/>

			{/* Stats Cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconTicket size={20} />}
						label="Active codes"
						value={stats.activeCodes}
						subtitle="Currently running"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconUsers size={20} />}
						label="Total redemptions"
						value={stats.redemptions}
						subtitle="All-time usage"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Revenue impact"
						value={formatCurrency(stats.revenueImpact)}
						subtitle="Estimated (dummy)"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconClockExclamation size={20} />}
						label="Expiring soon"
						value={stats.expiringSoon}
						subtitle="Within 7 days"
					/>
				</Grid.Col>
			</Grid>

			{/* Section Tabs */}
			<Tabs
				value={tab}
				onChange={(val) => setTab((val as DiscountsTab) ?? "all")}
				mb="md"
			>
				<Tabs.List>
					<Tabs.Tab
						value="all"
						rightSection={
							<Badge size="sm" variant="light">
								{counts.all}
							</Badge>
						}
					>
						All
					</Tabs.Tab>
					<Tabs.Tab
						value="active"
						rightSection={
							<Badge size="sm" variant="light">
								{counts.active}
							</Badge>
						}
					>
						Active
					</Tabs.Tab>
					<Tabs.Tab
						value="scheduled"
						rightSection={
							<Badge size="sm" variant="light">
								{counts.scheduled}
							</Badge>
						}
					>
						Scheduled
					</Tabs.Tab>
					<Tabs.Tab
						value="expired"
						rightSection={
							<Badge size="sm" variant="light">
								{counts.expired}
							</Badge>
						}
					>
						Expired
					</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			{/* Content Card */}
			<Card withBorder>
				<Table.ScrollContainer minWidth={900}>
					<Table striped highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Code</Table.Th>
								<Table.Th>Type</Table.Th>
								<Table.Th>Scope</Table.Th>
								<Table.Th>Period</Table.Th>
								<Table.Th>Used</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th style={{ width: 48 }} />
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{visible.length > 0 ? (
								visible.map((d) => (
									<Table.Tr
										key={d.id}
										style={{ cursor: "pointer" }}
										onClick={() => handleEdit(d)}
									>
										<Table.Td>
											<Text ff="monospace" fw={500}>
												{d.code}
											</Text>
										</Table.Td>
										<Table.Td>{formatDiscountType(d)}</Table.Td>
										<Table.Td>{d.scopeLabel ?? "—"}</Table.Td>
										<Table.Td>
											{formatDate(d.startDate)} → {formatDate(d.endDate)}
										</Table.Td>
										<Table.Td>{formatUsage(d)}</Table.Td>
										<Table.Td>
											<StatusBadge status={d.status} />
										</Table.Td>
										<Table.Td>
											<Menu shadow="md" position="bottom-end" withinPortal>
												<Menu.Target>
													<ActionIcon
														variant="subtle"
														color="gray"
														onClick={(e) => e.stopPropagation()}
													>
														<IconDots size={16} />
													</ActionIcon>
												</Menu.Target>
												<Menu.Dropdown onClick={(e) => e.stopPropagation()}>
													<Menu.Item
														leftSection={<IconEdit size={16} />}
														onClick={() => handleEdit(d)}
													>
														Edit
													</Menu.Item>
													<Menu.Item
														leftSection={<IconCopy size={16} />}
														onClick={() => handleCopy(d)}
													>
														Copy code
													</Menu.Item>
													<Menu.Item
														color="red"
														leftSection={<IconTrash size={16} />}
														onClick={() => handleDelete(d)}
													>
														Delete
													</Menu.Item>
												</Menu.Dropdown>
											</Menu>
										</Table.Td>
									</Table.Tr>
								))
							) : (
								<Table.Tr>
									<Table.Td colSpan={7}>
										<Center py="xl">
											<Stack align="center" gap="sm">
												<IconTicket
													size={36}
													color="var(--mantine-color-gray-5)"
												/>
												<Text c="dimmed">
													{discounts.length === 0
														? "No discounts yet"
														: "No discounts in this tab"}
												</Text>
												{discounts.length === 0 && (
													<Button
														variant="light"
														leftSection={<IconPlus size={16} />}
														onClick={handleAdd}
													>
														Add Discount
													</Button>
												)}
											</Stack>
										</Center>
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Card>
		</Container>
	);
}
