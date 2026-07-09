import {
	Alert,
	Anchor,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Stack,
	Table,
	Text,
	Textarea,
	Title,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowLeft,
	IconCoin,
	IconReceipt,
	IconShoppingCart,
	IconStar,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { type Customer, dummyCustomers } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { openEditCustomerModal } from "./AddCustomerModal";
import { formatCurrency, formatDate, getDataIssue } from "./format";
import { getCustomerOrders } from "./orders";

/** Satu baris field kontak: label tebal di atas nilainya. */
function ContactField({ label, value }: { label: string; value: string }) {
	return (
		<Stack gap={2}>
			<Text size="sm" fw={700}>
				{label}
			</Text>
			<Text size="sm" c="dimmed">
				{value || "—"}
			</Text>
		</Stack>
	);
}

export function CustomerDetail() {
	const navigate = useNavigate();
	const { id } = useParams();

	// Simpan customer di state lokal supaya edit & notes bisa memperbarui tampilan.
	const [customer, setCustomer] = useState(() =>
		dummyCustomers.find((c) => String(c.id) === id),
	);
	const [notes, setNotes] = useState(customer?.notes ?? "");

	usePageTitle(customer ? customer.name : "Customer");

	if (!customer) {
		return (
			<Container size="lg">
				<PageHeader title="Customer not found" />
				<Button
					variant="default"
					leftSection={<IconArrowLeft size={16} />}
					onClick={() => navigate("/customers")}
				>
					Back to customers
				</Button>
			</Container>
		);
	}

	const issue = getDataIssue(customer);
	const orders = getCustomerOrders(customer);
	const avgOrder =
		customer.ordersCount > 0
			? Math.round(customer.lifetimeValue / customer.ordersCount)
			: 0;
	const segmentLabel =
		customer.segment[0].toUpperCase() + customer.segment.slice(1);

	const handleEdit = (updated: Customer) => {
		const idx = dummyCustomers.findIndex((c) => c.id === updated.id);
		if (idx !== -1) dummyCustomers[idx] = updated; // mutasi sumber dummy
		setCustomer(updated);
		notify.success("Customer updated");
	};

	const handleNotesBlur = () => {
		if (notes === (customer.notes ?? "")) return; // tak berubah → jangan spam toast
		const updated = { ...customer, notes };
		const idx = dummyCustomers.findIndex((c) => c.id === customer.id);
		if (idx !== -1) dummyCustomers[idx] = updated;
		setCustomer(updated);
		notify.success("Notes saved");
	};

	return (
		<Container size="lg">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/customers")}>
					Customers
				</Anchor>
				<Text size="sm" c="dimmed">
					{customer.name}
				</Text>
			</Breadcrumbs>

			<PageHeader
				title={customer.name}
				subtitle={`Joined ${formatDate(customer.joinedAt)}`}
				actions={
					<Group gap="sm">
						<Button
							variant="default"
							onClick={() => notify.info("Email composer belum tersedia")}
						>
							Send email
						</Button>
						<Button onClick={() => openEditCustomerModal(customer, handleEdit)}>
							Edit
						</Button>
					</Group>
				}
			/>

			{issue && (
				<Alert
					mb="lg"
					color={issue.level === "error" ? "red" : "yellow"}
					icon={<IconAlertTriangle size={18} />}
					title={issue.title}
				>
					<Group justify="space-between" align="center" wrap="nowrap">
						<Text size="sm">{issue.detail}</Text>
						<Button
							size="xs"
							variant="white"
							color={issue.level === "error" ? "red" : "yellow"}
							onClick={() => openEditCustomerModal(customer, handleEdit)}
						>
							Fix it
						</Button>
					</Group>
				</Alert>
			)}

			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconShoppingCart size={20} />}
						label="Total Orders"
						value={customer.ordersCount}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Lifetime Value"
						value={formatCurrency(customer.lifetimeValue)}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconReceipt size={20} />}
						label="Avg. Order"
						value={formatCurrency(avgOrder)}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStar size={20} />}
						label="Segment"
						value={segmentLabel}
					/>
				</Grid.Col>
			</Grid>

			<Grid gap="md">
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Card withBorder>
						<Title order={4} mb="md">
							Order history
						</Title>
						{orders.length === 0 ? (
							<Center py="xl">
								<Stack align="center" gap="sm">
									<IconShoppingCart
										size={36}
										color="var(--mantine-color-gray-5)"
									/>
									<Text c="dimmed">No orders yet</Text>
								</Stack>
							</Center>
						) : (
							<Table.ScrollContainer minWidth={500}>
								<Table highlightOnHover verticalSpacing="sm">
									<Table.Thead>
										<Table.Tr>
											<Table.Th>Order</Table.Th>
											<Table.Th>Date</Table.Th>
											<Table.Th>Total</Table.Th>
											<Table.Th>Status</Table.Th>
										</Table.Tr>
									</Table.Thead>
									<Table.Tbody>
										{orders.map((order) => (
											<Table.Tr
												key={order.id}
												style={{ cursor: "pointer" }}
												onClick={() => navigate(`/orders/${order.id}`)}
											>
												<Table.Td>
													<Text fw={500}>{order.id}</Text>
												</Table.Td>
												<Table.Td>{formatDate(order.date)}</Table.Td>
												<Table.Td>{formatCurrency(order.total)}</Table.Td>
												<Table.Td>
													<StatusBadge status={order.status} />
												</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							</Table.ScrollContainer>
						)}
					</Card>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap="md">
						<Card withBorder>
							<Title order={4} mb="md">
								Contact
							</Title>
							<Stack gap="md">
								<ContactField label="Email" value={customer.email} />
								<ContactField label="Phone" value={customer.phone ?? ""} />
								<ContactField label="Location" value={customer.city ?? ""} />
							</Stack>
						</Card>

						<Card withBorder>
							<Title order={4} mb="md">
								Notes
							</Title>
							<Textarea
								placeholder="Add an internal note about this customer…"
								autosize
								minRows={3}
								value={notes}
								onChange={(e) => setNotes(e.currentTarget.value)}
								onBlur={handleNotesBlur}
							/>
							<Text size="xs" c="dimmed" mt="xs">
								Notes save when you click away.
							</Text>
						</Card>
					</Stack>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
