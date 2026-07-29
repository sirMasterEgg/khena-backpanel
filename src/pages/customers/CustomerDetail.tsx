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
	Loader,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import { getCustomer, patchCustomer } from "@/api/customers";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerFormModal } from "./CustomerFormModal";
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
	const queryClient = useQueryClient();

	const [notes, setNotes] = useState("");
	const [editOpened, setEditOpened] = useState(false);

	const {
		data: customer,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["customers", id],
		queryFn: () => getCustomer(id as string),
		enabled: Boolean(id),
	});

	usePageTitle(customer ? customer.name : "Customer");

	// Prefill notes saat data detail datang / berganti.
	useEffect(() => {
		setNotes(customer?.internalNotes ?? "");
	}, [customer?.internalNotes]);

	const notesMutation = useMutation({
		mutationFn: (internalNotes: string) =>
			patchCustomer(id as string, { internalNotes }),
		onSuccess: () => {
			notify.success("Notes saved");
			queryClient.invalidateQueries({ queryKey: ["customers"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleNotesBlur = () => {
		// Tak berubah → jangan kirim request & jangan spam toast.
		if (notes === (customer?.internalNotes ?? "")) return;
		notesMutation.mutate(notes);
	};

	if (isLoading) {
		return (
			<Container size="lg">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	if (isError || !customer) {
		return (
			<Container size="lg">
				<PageHeader title="Customer not found" />
				<Text c="dimmed" mb="md">
					{error ? getApiErrorMessage(error) : "Customer not found"}
				</Text>
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
	const orders = getCustomerOrders({
		id: customer.id,
		totalOrders: customer.totalOrders,
		lifetimeValue: customer.lifetimeValue,
		joinedAt: customer.joinedAt,
	});
	const segmentLabel =
		customer.segment[0].toUpperCase() + customer.segment.slice(1);

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
						<Button onClick={() => setEditOpened(true)}>Edit</Button>
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
							onClick={() => setEditOpened(true)}
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
						value={customer.totalOrders}
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
						value={formatCurrency(customer.averageOrder)}
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
						<Text size="xs" c="dimmed" mb="md">
							Data order di bawah masih dummy — modul order belum ada di API.
						</Text>
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
								disabled={notesMutation.isPending}
							/>
							<Text size="xs" c="dimmed" mt="xs">
								Notes save when you click away.
							</Text>
						</Card>
					</Stack>
				</Grid.Col>
			</Grid>

			<CustomerFormModal
				opened={editOpened}
				initial={{
					id: customer.id,
					name: customer.name,
					email: customer.email,
					phone: customer.phone,
				}}
				onClose={() => setEditOpened(false)}
				onSuccess={() =>
					queryClient.invalidateQueries({ queryKey: ["customers"] })
				}
			/>
		</Container>
	);
}
