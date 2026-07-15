import {
	Alert,
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Container,
	Divider,
	Grid,
	Group,
	List,
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
	IconTruck,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { canViewPrices } from "@/config/permissions";
import { dummyOrders } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { formatCurrency, formatDate } from "./format";
import type { Order } from "./orderTypes";
import { PackChecklist } from "./PackChecklist";

// Opsi slot waktu pengiriman.
const TIME_SLOTS = ["09:00 - 12:00", "12:00 - 15:00", "15:00 - 18:00"];

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

	// Simpan order di state lokal supaya perubahan status/packing/notes langsung tampil.
	const [order, setOrder] = useState<Order | undefined>(() =>
		dummyOrders.find((o) => o.id === id),
	);
	const [notes, setNotes] = useState(order?.notes ?? "");
	const [deliveryDate, setDeliveryDate] = useState(order?.delivery?.date ?? "");
	const [timeSlot, setTimeSlot] = useState(order?.delivery?.timeSlot ?? "");
	const [driverNotes, setDriverNotes] = useState(order?.delivery?.notes ?? "");
	// Delivery bersifat opsional — aktif otomatis bila order sudah punya data delivery.
	const [deliveryEnabled, setDeliveryEnabled] = useState(
		Boolean(
			order?.delivery?.date ||
				order?.delivery?.timeSlot ||
				order?.delivery?.notes ||
				order?.delivery?.deliveredAt,
		),
	);

	// Langkah wizard aktif. Hitung awal dari status agar order lama langsung
	// mendarat di langkah yang tepat.
	const [active, setActive] = useState(() => {
		if (!order) return 0;
		const isEditable =
			order.status === "pending" || order.status === "processing";
		const packedAll = order.items.every((i) => i.packed);
		if (isEditable) return packedAll ? 1 : 0;
		return order.status === "completed" ? 3 : 2;
	});

	usePageTitle(order ? `Order #${order.id}` : "Order not found");

	if (!order) {
		return (
			<Container size="lg">
				<PageHeader title="Order not found" />
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

	// Persist perubahan ke sumber dummy + state lokal (pola CustomerDetail).
	const persist = (updated: Order) => {
		const idx = dummyOrders.findIndex((o) => o.id === updated.id);
		if (idx !== -1) dummyOrders[idx] = updated;
		setOrder(updated);
	};

	const packedCount = order.items.filter((i) => i.packed).length;
	const totalItems = order.items.length;
	const allPacked = packedCount === totalItems;
	const editable = order.status === "pending" || order.status === "processing";

	const subtotal =
		order.subtotal ??
		order.items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.qty, 0);
	const shippingCost = order.shipping ?? 0;

	// Kumpulkan data delivery dari form bila toggle aktif.
	const collectDelivery = () =>
		deliveryEnabled
			? {
					date: deliveryDate || order.delivery?.date,
					timeSlot: timeSlot || order.delivery?.timeSlot,
					notes: driverNotes || order.delivery?.notes,
				}
			: {};

	const handleMarkPacked = (index: number) => {
		const items = order.items.map((item, i) =>
			i === index ? { ...item, packed: true } : item,
		);
		persist({ ...order, items });
	};

	// Simpan delivery (opsional) lalu ubah status jadi shipped (akhir langkah Delivery).
	const handleConfirmShip = () => {
		const items = order.items.map((item) => ({ ...item, packed: true }));
		persist({
			...order,
			items,
			status: "shipped",
			delivery: { ...order.delivery, ...collectDelivery() },
		});
		setActive(3);
		notify.success(`#${order.id} shipped — stock deducted`, "Order shipped");
	};

	// Tandai order selesai (completed) + catat tanggal penyelesaian.
	const handleMarkComplete = () => {
		const deliveredAt = new Date().toISOString().slice(0, 10);
		persist({
			...order,
			status: "completed",
			delivery: { ...order.delivery, ...collectDelivery(), deliveredAt },
		});
		setActive(3);
		notify.success(`#${order.id} marked as complete`, "Order completed");
	};

	const handleNotesBlur = () => {
		if (notes === (order.notes ?? "")) return; // tak berubah → jangan spam toast
		persist({ ...order, notes });
		notify.success("Notes saved");
	};

	const issues = order.dataIssues ?? [];
	const deliveredAt = order.delivery?.deliveredAt;

	return (
		<Container size="lg">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/orders")}>
					Orders
				</Anchor>
				<Text size="sm" c="dimmed">
					#{order.id}
				</Text>
			</Breadcrumbs>

			<PageHeader
				title={`Order #${order.id}`}
				subtitle={`Placed ${formatDate(order.date)}`}
				actions={
					<Group gap="sm">
						<StatusBadge status={order.status} />
						<Button
							variant="default"
							leftSection={<IconPrinter size={16} />}
							onClick={() => notify.info("Print label belum tersedia")}
						>
							Print label
						</Button>
						{canViewPrices && (
							<Button
								variant="default"
								leftSection={<IconReceipt size={16} />}
								onClick={() => notify.info("Print invoice belum tersedia")}
							>
								Print invoice
							</Button>
						)}
						{order.status === "shipped" && (
							<Button
								leftSection={<IconCircleCheck size={16} />}
								onClick={handleMarkComplete}
							>
								Mark as complete
							</Button>
						)}
					</Group>
				}
			/>

			{(order.hasDataIssue || issues.length > 0) && (
				<Alert
					mb="lg"
					color="yellow"
					icon={<IconAlertTriangle size={18} />}
					title="This order has data problems"
				>
					{issues.length > 0 ? (
						<List size="sm" spacing={4}>
							{issues.map((issue) => (
								<List.Item key={issue}>{issue}</List.Item>
							))}
						</List>
					) : (
						<Text size="sm">
							Order ini ditandai bermasalah. Periksa kembali datanya.
						</Text>
					)}
				</Alert>
			)}

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
						{/* Order aktif: cegah lompat ke langkah berikutnya sebelum syaratnya
						    terpenuhi. Order read-only (shipped/completed/cancelled): bebas
						    ditinjau bolak-balik. */}
						<Stepper
							active={active}
							onStepClick={setActive}
							allowNextStepsSelect={!editable}
						>
							{/* LANGKAH 1 — Pack */}
							<Stepper.Step label="Pack" description="Pack items">
								<Group justify="space-between" mt="md" mb="md">
									<Title order={4}>Pack items</Title>
									<Badge size="lg" variant="light">
										{packedCount}/{totalItems} packed
									</Badge>
								</Group>
								<PackChecklist
									items={order.items}
									onMarkPacked={editable ? handleMarkPacked : undefined}
								/>
								{editable && !allPacked && (
									<Text size="sm" c="dimmed" mt="md">
										Tandai semua item sebagai packed untuk lanjut ke Review.
									</Text>
								)}
							</Stepper.Step>

							{/* LANGKAH 2 — Review */}
							<Stepper.Step label="Review" description="Confirm details">
								<Stack gap="lg" mt="md">
									{/* Customer & Shipping address sejajar di atas */}
									<Grid gap="md">
										{order.customer && (
											<Grid.Col span={{ base: 12, md: 6 }}>
												<Card withBorder h="100%">
													<Title order={4} mb="md">
														Customer
													</Title>
													<Group gap="sm" mb="md" wrap="nowrap">
														<CustomerAvatar
															name={order.customer.name}
															color={order.customerAvatarColor}
														/>
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
															value={order.customer.phone ?? ""}
														/>
														{canViewPrices && (
															<InfoField
																label="Total spend"
																value={
																	order.customer.totalSpend != null
																		? formatCurrency(order.customer.totalSpend)
																		: ""
																}
															/>
														)}
													</Group>
													<Button
														variant="light"
														mt="md"
														disabled={order.customer.id == null}
														onClick={() =>
															navigate(`/customers/${order.customer?.id}`)
														}
													>
														View customer profile
													</Button>
												</Card>
											</Grid.Col>
										)}
										{order.shippingInfo && (
											<Grid.Col span={{ base: 12, md: 6 }}>
												<Card withBorder h="100%">
													<Title order={4} mb="md">
														Shipping address
													</Title>
													<Stack gap={2} mb="md">
														<Text size="sm" fw={500}>
															{order.shippingInfo.recipient}
														</Text>
														{order.shippingInfo.addressLines.map((line) => (
															<Text key={line} size="sm" c="dimmed">
																{line}
															</Text>
														))}
													</Stack>
													<Group gap="xl" mb="md">
														<InfoField
															label="Province"
															value={order.shippingInfo.province ?? ""}
														/>
														<InfoField
															label="Post code"
															value={order.shippingInfo.postCode ?? ""}
														/>
													</Group>
													<InfoField
														label="Tracking"
														value={order.shippingInfo.tracking ?? ""}
													/>
												</Card>
											</Grid.Col>
										)}
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
														<Table.Tr key={item.sku ?? item.productName}>
															<Table.Td>
																<Stack gap={2}>
																	<Text size="sm">{item.productName}</Text>
																	{item.sku && (
																		<Text size="xs" c="dimmed">
																			{item.sku}
																		</Text>
																	)}
																</Stack>
															</Table.Td>
															<Table.Td ta="center">{item.qty}</Table.Td>
															{canViewPrices && (
																<Table.Td ta="right">
																	{formatCurrency(item.unitPrice ?? 0)}
																</Table.Td>
															)}
															{canViewPrices && (
																<Table.Td ta="right">
																	{formatCurrency(
																		(item.unitPrice ?? 0) * item.qty,
																	)}
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
															{formatCurrency(subtotal)}
														</Text>
													</Group>
													<Group gap="xl">
														<Text size="sm" c="dimmed">
															Shipping
														</Text>
														<Text size="sm" w={140} ta="right">
															{formatCurrency(shippingCost)}
														</Text>
													</Group>
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

									{deliveredAt ? (
										<Alert
											color="green"
											icon={<IconCircleCheck size={18} />}
											title="Order delivered"
										>
											Delivered on {formatDate(deliveredAt)}
										</Alert>
									) : editable || order.status === "shipped" ? (
										<>
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
															value={deliveryDate || null}
															onChange={(val) => setDeliveryDate(val ?? "")}
														/>
														<Select
															label="Time slot"
															placeholder="Pick a slot"
															data={TIME_SLOTS}
															leftSection={<IconClock size={16} />}
															value={timeSlot || null}
															onChange={(val) => setTimeSlot(val ?? "")}
														/>
													</Group>
													<TextInput
														label="Driver / delivery notes"
														placeholder="mis. Titip ke satpam"
														value={driverNotes}
														onChange={(e) =>
															setDriverNotes(e.currentTarget.value)
														}
													/>
												</Stack>
											)}
										</>
									) : (
										// Order dibatalkan: tampilkan jadwal apa adanya (read-only).
										<Group gap="xl">
											<InfoField
												label="Delivery date"
												value={formatDate(order.delivery?.date ?? null)}
											/>
											<InfoField
												label="Time slot"
												value={order.delivery?.timeSlot ?? ""}
											/>
											<InfoField
												label="Driver / delivery notes"
												value={order.delivery?.notes ?? ""}
											/>
										</Group>
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
									{deliveredAt && (
										<Text size="sm" c="dimmed">
											Delivered on {formatDate(deliveredAt)}
										</Text>
									)}
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
										disabled={active === 0 && editable && !allPacked}
									>
										Next
									</Button>
								)}
								{/* Aksi akhir langkah Delivery, sejajar dengan tombol Back. */}
								{active === 2 &&
									!deliveredAt &&
									(editable ? (
										<Button
											leftSection={<IconTruck size={16} />}
											onClick={handleConfirmShip}
										>
											Confirm &amp; ship
										</Button>
									) : order.status === "shipped" ? (
										<Button
											leftSection={<IconCircleCheck size={16} />}
											onClick={handleMarkComplete}
										>
											Mark as complete
										</Button>
									) : null)}
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
						/>
						<Text size="xs" c="dimmed" mt="xs">
							Notes save when you click away.
						</Text>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
