import {
	Alert,
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Divider,
	Grid,
	Group,
	Loader,
	Select,
	Stack,
	Stepper,
	Switch,
	Table,
	Text,
	Textarea,
	TextInput,
	Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
	IconAlertTriangle,
	IconArrowLeft,
	IconArrowRight,
	IconCalendar,
	IconCircleCheck,
	IconClock,
	IconPrinter,
	IconReceipt,
	IconSettings,
	IconTruck,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import {
	getOrderSalesDetail,
	markOrderItemPacked,
	type OrderSalesStatus,
	type OrderSalesTimeSlot,
	type OrderSalesUpdateInput,
	updateOrderSales,
	updateOrderSalesStatus,
} from "@/api/orderSales";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { canViewPrices } from "@/config/permissions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { formatCurrency, formatDate } from "./format";
import { PackChecklist } from "./PackChecklist";
import { PrintDocumentModal } from "./PrintDocumentModal";
import { ShipOrderModal } from "./ShipOrderModal";

const TIME_SLOT_OPTIONS = [
	{ value: "morning", label: "Morning" },
	{ value: "afternoon", label: "Afternoon" },
	{ value: "evening", label: "Evening" },
];

const TIME_SLOT_LABEL: Record<OrderSalesTimeSlot, string> = {
	morning: "Morning",
	afternoon: "Afternoon",
	evening: "Evening",
};

/**
 * Tombol aksi di akhir wizard, menyesuaikan status order saat ini. `pending`
 * sengaja TIDAK ada di sini — transisi pending → processing sekarang hanya
 * bisa dipicu dari langkah Pack (lihat tombol "Start processing" di sana),
 * supaya packing selalu terkunci sampai order mulai diproses.
 */
const NEXT_STATUS_ACTION: Partial<
	Record<
		OrderSalesStatus,
		{ label: string; icon: typeof IconTruck; next: OrderSalesStatus }
	>
> = {
	processing: { label: "Confirm & ship", icon: IconTruck, next: "shipped" },
	shipped: {
		label: "Mark as complete",
		icon: IconCircleCheck,
		next: "completed",
	},
};

/** Satu baris field: label tebal di atas nilainya. */
function InfoField({ label, value }: { label: string; value: string }) {
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

export function OrderDetail() {
	const navigate = useNavigate();
	const { id } = useParams();
	const queryClient = useQueryClient();

	const {
		data: order,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["orders", id],
		queryFn: () => getOrderSalesDetail(id as string),
		enabled: Boolean(id),
	});

	usePageTitle(order ? `Order #${order.invoiceNumber}` : "Order");

	// Langkah wizard aktif — dihitung ulang dari status setiap kali statusnya
	// berubah (bukan tiap render, supaya tidak mengganggu navigasi manual user).
	const [active, setActive] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: sengaja hanya bergantung pada status, bukan seluruh objek order — supaya langkah wizard tidak ter-reset tiap kali order di-refetch (mis. setelah packing) tanpa status-nya berubah.
	useEffect(() => {
		if (!order) return;
		const isEditable =
			order.status === "pending" || order.status === "processing";
		const packedAll = order.items.every((i) => i.isPacked ?? false);
		if (isEditable) {
			setActive(packedAll ? 1 : 0);
		} else {
			setActive(order.status === "completed" ? 3 : 2);
		}
	}, [order?.status]);

	// Form jadwal delivery — di-seed ulang dari data server (bukan state independen).
	const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
	const [timeSlot, setTimeSlot] = useState<OrderSalesTimeSlot | null>(null);
	const [deliveryNotes, setDeliveryNotes] = useState("");
	// Delivery bersifat opsional — aktif otomatis bila order sudah punya data delivery.
	const [deliveryEnabled, setDeliveryEnabled] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: sengaja hanya bergantung pada field delivery, bukan seluruh objek order — supaya ketikan user tidak tertimpa tiap kali order di-refetch karena alasan lain (mis. packing).
	useEffect(() => {
		if (!order) return;
		setDeliveryDate(order.delivery?.deliveryDate ?? null);
		setTimeSlot(order.delivery?.timeSlot ?? null);
		setDeliveryNotes(order.delivery?.deliveryNotes ?? "");
		setDeliveryEnabled(
			Boolean(
				order.delivery?.deliveryDate ||
					order.delivery?.timeSlot ||
					order.delivery?.deliveryNotes,
			),
		);
	}, [
		order?.id,
		order?.delivery?.deliveryDate,
		order?.delivery?.timeSlot,
		order?.delivery?.deliveryNotes,
	]);

	// Catatan internal — di-seed ulang dari data server.
	const [notes, setNotes] = useState("");
	// biome-ignore lint/correctness/useExhaustiveDependencies: sengaja hanya bergantung pada internalNote, bukan seluruh objek order — supaya ketikan user tidak tertimpa tiap kali order di-refetch karena alasan lain.
	useEffect(() => {
		if (!order) return;
		setNotes(order.internalNote ?? "");
	}, [order?.id, order?.internalNote]);

	const [shipModalOpen, setShipModalOpen] = useState(false);
	const [pendingPackItemId, setPendingPackItemId] = useState<string | null>(
		null,
	);
	const [printKind, setPrintKind] = useState<"invoice" | "label" | null>(null);

	const packMutation = useMutation({
		mutationFn: (itemId: string) => {
			setPendingPackItemId(itemId);
			return markOrderItemPacked(id as string, { itemId, isPacked: true });
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["orders", id] }),
		onError: (err) => notify.error(getApiErrorMessage(err)),
		onSettled: () => setPendingPackItemId(null),
	});

	const statusMutation = useMutation({
		mutationFn: (body: { status: OrderSalesStatus; trackingNumber?: string }) =>
			updateOrderSalesStatus(id as string, body),
		onSuccess: (updated) => {
			queryClient.setQueryData(["orders", id], updated);
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			notify.success(
				`#${updated.invoiceNumber} → ${updated.status}`,
				"Status updated",
			);
			setShipModalOpen(false);
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const deliveryMutation = useMutation({
		mutationFn: (body: OrderSalesUpdateInput) =>
			updateOrderSales(id as string, body),
		onSuccess: (updated) => {
			queryClient.setQueryData(["orders", id], updated);
			notify.success("Jadwal pengiriman tersimpan");
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const notesMutation = useMutation({
		mutationFn: (internalNote: string) =>
			updateOrderSales(id as string, { internalNote }),
		onSuccess: (updated) => {
			queryClient.setQueryData(["orders", id], updated);
			notify.success("Notes saved");
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	if (isLoading) {
		return (
			<Container size="lg">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	if (isError || !order) {
		return (
			<Container size="lg">
				<PageHeader
					title="Order not found"
					subtitle={error ? getApiErrorMessage(error) : undefined}
				/>
				<Button
					variant="default"
					leftSection={<IconArrowLeft size={16} />}
					onClick={() => navigate("/orders")}
				>
					Back to orders
				</Button>
			</Container>
		);
	}

	const packedCount = order.items.filter((i) => i.isPacked ?? false).length;
	const totalItems = order.items.length;
	const allPacked = packedCount === totalItems;
	const isEditableWizard =
		order.status === "pending" || order.status === "processing";
	// Order di status terminal: packing, jadwal delivery, dan catatan internal
	// semuanya read-only (server menolak PATCH/mark-as-packed dengan 400).
	const readOnly = order.status === "completed" || order.status === "cancelled";

	const nextAction = NEXT_STATUS_ACTION[order.status];
	const NextActionIcon = nextAction?.icon;

	const handleFinalAction = () => {
		if (!nextAction) return;
		if (nextAction.next === "shipped") {
			setShipModalOpen(true);
			return;
		}
		statusMutation.mutate({ status: nextAction.next });
	};

	const handleConfirmShip = (trackingNumber: string) => {
		statusMutation.mutate({ status: "shipped", trackingNumber });
	};

	const handleSaveDelivery = () => {
		const body: OrderSalesUpdateInput = {};
		if (deliveryDate) body.deliveryDate = deliveryDate;
		if (timeSlot) body.deliveryTimeSlot = timeSlot;
		if (deliveryNotes.trim()) body.deliveryNotes = deliveryNotes.trim();
		deliveryMutation.mutate(body);
	};

	const handleNotesBlur = () => {
		if (notes === (order.internalNote ?? "")) return; // tak berubah → jangan spam request
		notesMutation.mutate(notes);
	};

	return (
		<Container size="lg">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/orders")}>
					Orders
				</Anchor>
				<Text size="sm" c="dimmed">
					#{order.invoiceNumber}
				</Text>
			</Breadcrumbs>

			<PageHeader
				title={`Order #${order.invoiceNumber}`}
				subtitle={`Placed ${formatDate(order.date)}`}
				actions={
					<Group gap="sm">
						<StatusBadge status={order.status} />
						<Button
							variant="default"
							leftSection={<IconPrinter size={16} />}
							onClick={() => setPrintKind("label")}
						>
							Print label
						</Button>
						{canViewPrices && (
							<Button
								variant="default"
								leftSection={<IconReceipt size={16} />}
								onClick={() => setPrintKind("invoice")}
							>
								Print invoice
							</Button>
						)}
					</Group>
				}
			/>

			{order.status === "cancelled" && (
				<Alert
					mb="lg"
					color="red"
					icon={<IconAlertTriangle size={18} />}
					title="Order was cancelled"
				>
					<Text size="sm">
						Order ini sudah dibatalkan. Langkah pemenuhan hanya bisa ditinjau.
					</Text>
				</Alert>
			)}

			<Grid gap="md">
				{/* Kolom kiri — wizard pemenuhan order */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Card withBorder>
						<Stepper
							active={active}
							onStepClick={setActive}
							allowNextStepsSelect={!isEditableWizard}
						>
							{/* LANGKAH 1 — Pack */}
							<Stepper.Step label="Pack" description="Pack items">
								<Group justify="space-between" mt="md" mb="md">
									<Title order={4}>Pack items</Title>
									<Badge size="lg" variant="light">
										{packedCount}/{totalItems} packed
									</Badge>
								</Group>
								{order.status === "pending" && (
									<Alert
										mb="md"
										color="blue"
										icon={<IconSettings size={18} />}
										title="Order belum diproses"
									>
										<Stack gap="sm">
											<Text size="sm">
												Klik "Start processing" dulu sebelum item bisa ditandai
												packed.
											</Text>
											<Button
												leftSection={<IconSettings size={16} />}
												loading={statusMutation.isPending}
												onClick={() =>
													statusMutation.mutate({ status: "processing" })
												}
											>
												Start processing
											</Button>
										</Stack>
									</Alert>
								)}
								<PackChecklist
									items={order.items}
									onMarkPacked={
										readOnly
											? undefined
											: (itemId) => packMutation.mutate(itemId)
									}
									pendingItemId={pendingPackItemId}
									disabled={order.status === "pending"}
								/>
								{order.status === "processing" && !allPacked && (
									<Text size="sm" c="dimmed" mt="md">
										Tandai semua item sebagai packed untuk lanjut ke Review.
									</Text>
								)}
							</Stepper.Step>

							{/* LANGKAH 2 — Review */}
							<Stepper.Step label="Review" description="Confirm details">
								<Stack gap="lg" mt="md">
									<Grid gap="md">
										<Grid.Col span={{ base: 12, md: 6 }}>
											<Card withBorder h="100%">
												<Title order={4} mb="md">
													Customer
												</Title>
												<Group gap="sm" mb="md" wrap="nowrap">
													<CustomerAvatar name={order.customer.name} />
													<Stack gap={0}>
														<Text size="sm" fw={500}>
															{order.customer.name}
														</Text>
														<Text size="xs" c="dimmed">
															{order.customer.email}
														</Text>
													</Stack>
												</Group>
												<Group gap="xl">
													<InfoField
														label="Phone"
														value={order.customer.phone}
													/>
													{canViewPrices && (
														<InfoField
															label="Total spend"
															value={formatCurrency(order.customer.totalSpend)}
														/>
													)}
												</Group>
												<Button
													variant="light"
													mt="md"
													onClick={() =>
														navigate(`/customers/${order.customer.id}`)
													}
												>
													View customer profile
												</Button>
											</Card>
										</Grid.Col>
										<Grid.Col span={{ base: 12, md: 6 }}>
											<Card withBorder h="100%">
												<Title order={4} mb="md">
													Shipping address
												</Title>
												<Stack gap={2} mb="md">
													<Text size="sm" fw={500}>
														{order.customer.name}
													</Text>
													<Text size="sm" c="dimmed">
														{order.shipping.address}
													</Text>
													<Text size="sm" c="dimmed">
														{order.shipping.city}
													</Text>
												</Stack>
												<Group gap="xl" mb="md">
													<InfoField
														label="Province"
														value={order.shipping.province}
													/>
													<InfoField
														label="Post code"
														value={order.shipping.zipCode}
													/>
												</Group>
												<InfoField
													label="Tracking"
													value={order.shipping.trackingNumber ?? ""}
												/>
											</Card>
										</Grid.Col>
									</Grid>

									<div>
										<Title order={4} mb="md">
											Packed items
										</Title>
										<PackChecklist items={order.items} />
									</div>

									<div>
										<Title order={4} mb="md">
											Order items
										</Title>
										<Table.ScrollContainer minWidth={400}>
											<Table verticalSpacing="sm">
												<Table.Thead>
													<Table.Tr>
														<Table.Th>Product</Table.Th>
														<Table.Th ta="center">Qty</Table.Th>
														{canViewPrices && (
															<Table.Th ta="right">Price</Table.Th>
														)}
														{canViewPrices && (
															<Table.Th ta="right">Subtotal</Table.Th>
														)}
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{order.items.map((item) => (
														<Table.Tr key={item.id}>
															<Table.Td>
																<Stack gap={2}>
																	<Text size="sm">{item.name}</Text>
																	<Text size="xs" c="dimmed">
																		{item.sku}
																	</Text>
																</Stack>
															</Table.Td>
															<Table.Td ta="center">{item.quantity}</Table.Td>
															{canViewPrices && (
																<Table.Td ta="right">
																	{formatCurrency(item.price)}
																</Table.Td>
															)}
															{canViewPrices && (
																<Table.Td ta="right">
																	{formatCurrency(item.price * item.quantity)}
																</Table.Td>
															)}
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</Table.ScrollContainer>

										<Divider my="md" />

										<Stack gap="xs" align="flex-end">
											{canViewPrices && (
												<>
													<Group gap="xl">
														<Text size="sm" c="dimmed">
															Subtotal
														</Text>
														<Text size="sm" w={140} ta="right">
															{formatCurrency(order.subtotal)}
														</Text>
													</Group>
													<Group gap="xl">
														<Text size="sm" c="dimmed">
															Shipping
														</Text>
														<Text size="sm" w={140} ta="right">
															{formatCurrency(order.shippingCost)}
														</Text>
													</Group>
													{order.discount > 0 && (
														<Group gap="xl">
															<Text size="sm" c="dimmed">
																Discount
															</Text>
															<Text size="sm" w={140} ta="right">
																-{formatCurrency(order.discount)}
															</Text>
														</Group>
													)}
												</>
											)}
											<Group gap="xl">
												<Text fw={700}>Total</Text>
												<Text fw={700} w={140} ta="right">
													{formatCurrency(order.total)}
												</Text>
											</Group>
										</Stack>
									</div>
								</Stack>
							</Stepper.Step>

							{/* LANGKAH 3 — Delivery */}
							<Stepper.Step label="Delivery" description="Schedule & ship">
								<Stack gap="md" mt="md">
									<Group gap="xs">
										<IconTruck size={20} />
										<Title order={4}>Delivery</Title>
									</Group>

									{readOnly ? (
										order.delivery ? (
											<Group gap="xl">
												<InfoField
													label="Delivery date"
													value={formatDate(order.delivery.deliveryDate)}
												/>
												<InfoField
													label="Time slot"
													value={
														order.delivery.timeSlot
															? TIME_SLOT_LABEL[order.delivery.timeSlot]
															: ""
													}
												/>
												<InfoField
													label="Delivery notes"
													value={order.delivery.deliveryNotes ?? ""}
												/>
											</Group>
										) : (
											<Text c="dimmed">Belum ada jadwal pengiriman.</Text>
										)
									) : (
										<Stack gap="sm">
											<Switch
												label="Schedule delivery"
												description="Langkah opsional — nonaktifkan bila pengiriman belum dijadwalkan."
												checked={deliveryEnabled}
												onChange={(e) =>
													setDeliveryEnabled(e.currentTarget.checked)
												}
											/>

											{deliveryEnabled && (
												<Stack gap="sm">
													<Group grow align="flex-start">
														<DateInput
															label="Delivery date"
															placeholder="Pick delivery date"
															valueFormat="DD MMM YYYY"
															leftSection={<IconCalendar size={16} />}
															value={deliveryDate}
															onChange={(val) => setDeliveryDate(val ?? null)}
														/>
														<Select
															label="Time slot"
															placeholder="Pick a slot"
															data={TIME_SLOT_OPTIONS}
															leftSection={<IconClock size={16} />}
															value={timeSlot}
															onChange={(val) =>
																setTimeSlot((val as OrderSalesTimeSlot) ?? null)
															}
														/>
													</Group>
													<TextInput
														label="Delivery notes"
														placeholder="mis. Titip ke satpam"
														value={deliveryNotes}
														onChange={(e) =>
															setDeliveryNotes(e.currentTarget.value)
														}
													/>
													<Group justify="flex-end">
														<Button
															variant="light"
															loading={deliveryMutation.isPending}
															onClick={handleSaveDelivery}
														>
															Save schedule
														</Button>
													</Group>
												</Stack>
											)}
										</Stack>
									)}
								</Stack>
							</Stepper.Step>

							<Stepper.Completed>
								<Stack gap="xs" mt="md" align="center" py="lg">
									<IconCircleCheck
										size={48}
										color="var(--mantine-color-green-6)"
									/>
									<Title order={4}>Order completed</Title>
								</Stack>
							</Stepper.Completed>
						</Stepper>

						{/* Navigasi antar-langkah (hanya saat masih di dalam wizard) */}
						{active < 3 && (
							<Group justify="space-between" mt="xl">
								<Button
									variant="default"
									leftSection={<IconArrowLeft size={16} />}
									onClick={() => setActive((s) => s - 1)}
									disabled={active === 0}
								>
									Back
								</Button>
								{active < 2 && (
									<Button
										rightSection={<IconArrowRight size={16} />}
										onClick={() => setActive((s) => s + 1)}
										disabled={active === 0 && isEditableWizard && !allPacked}
									>
										Next
									</Button>
								)}
								{/* Aksi akhir langkah Delivery — menyesuaikan status saat ini. */}
								{active === 2 && nextAction && NextActionIcon && (
									<Button
										leftSection={<NextActionIcon size={16} />}
										loading={statusMutation.isPending}
										onClick={handleFinalAction}
									>
										{nextAction.label}
									</Button>
								)}
							</Group>
						)}
					</Card>
				</Grid.Col>

				{/* Kolom kanan — internal notes, selalu terlihat */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Card withBorder>
						<Title order={4} mb="md">
							Notes
						</Title>
						<Textarea
							placeholder="Add an internal note about this order…"
							autosize
							minRows={3}
							value={notes}
							onChange={(e) => setNotes(e.currentTarget.value)}
							onBlur={handleNotesBlur}
							disabled={readOnly}
						/>
						<Text size="xs" c="dimmed" mt="xs">
							Notes save when you click away.
						</Text>
					</Card>
				</Grid.Col>
			</Grid>

			<ShipOrderModal
				opened={shipModalOpen}
				onClose={() => setShipModalOpen(false)}
				onConfirm={handleConfirmShip}
				loading={statusMutation.isPending}
			/>
			<PrintDocumentModal
				opened={printKind !== null}
				onClose={() => setPrintKind(null)}
				kind={printKind ?? "invoice"}
				orderIds={[order.id]}
			/>
		</Container>
	);
}
