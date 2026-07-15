import {
	ActionIcon,
	Anchor,
	Autocomplete,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	Container,
	Divider,
	Grid,
	Group,
	Image,
	NumberInput,
	ScrollArea,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
	IconArrowLeft,
	IconPlus,
	IconSearch,
	IconTrash,
	IconUserPlus,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import {
	type Customer,
	dummyCustomers,
	dummyOrders,
	dummyProducts,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { SegmentBadge } from "@/pages/customers/SegmentBadge";
import { formatCurrency } from "./format";
import type { Order, OrderItem } from "./orderTypes";
import {
	getShippingZoneByCity,
	knownCities,
	knownProvinces,
} from "./shippingZones";

/** Gabungkan email + telepon jadi satu baris ("email · telepon"). */
function contactLine(customer: Pick<Customer, "email" | "phone">): string {
	return [customer.email, customer.phone].filter(Boolean).join(" · ");
}

type CustomerMode = "idle" | "search" | "new";

type ItemRow = { key: string; productId: number | null; qty: number };

/** Lookup produk by id untuk render opsi dropdown item. */
const productById = new Map(dummyProducts.map((p) => [p.id, p]));

export function OrderSales() {
	usePageTitle("Create Order");
	const navigate = useNavigate();

	// ----- Customer -----
	const [customer, setCustomer] = useState<Customer | null>(null);
	const [customerMode, setCustomerMode] = useState<CustomerMode>("idle");
	const [customerSearch, setCustomerSearch] = useState("");
	const [newName, setNewName] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPhone, setNewPhone] = useState("");

	// ----- Items (minimal 1 baris) -----
	const [items, setItems] = useState<ItemRow[]>([
		{ key: crypto.randomUUID(), productId: null, qty: 1 },
	]);

	// ----- Shipping -----
	const [street, setStreet] = useState("");
	const [shipCity, setShipCity] = useState("");
	const [shipProvince, setShipProvince] = useState("");
	const [shipPostCode, setShipPostCode] = useState("");
	const [shippingCost, setShippingCost] = useState<number | "">("");
	const [shippingManual, setShippingManual] = useState(false);

	// ----- Tanggal -----
	const [orderDate, setOrderDate] = useState<string>(
		new Date().toISOString().slice(0, 10),
	);

	// ----- Notes -----
	const [notes, setNotes] = useState("");

	// Opsi produk untuk Select item.
	const productOptions = useMemo(
		() => dummyProducts.map((p) => ({ value: String(p.id), label: p.name })),
		[],
	);

	// Hasil pencarian customer (filter nama/email/telepon).
	const customerResults = useMemo(() => {
		const q = customerSearch.trim().toLowerCase();
		if (!q) return dummyCustomers;
		return dummyCustomers.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.email.toLowerCase().includes(q) ||
				(c.phone ?? "").toLowerCase().includes(q),
		);
	}, [customerSearch]);

	// ----- Nilai turunan -----
	const zone = useMemo(() => getShippingZoneByCity(shipCity), [shipCity]);

	const subtotal = useMemo(
		() =>
			items.reduce((sum, row) => {
				const product = dummyProducts.find((p) => p.id === row.productId);
				return product ? sum + product.price * row.qty : sum;
			}, 0),
		[items],
	);

	const total = subtotal + (Number(shippingCost) || 0);

	// Phone opsional, tapi kalau diisi harus format nomor HP yang valid.
	const newPhoneError =
		newPhone.trim().length > 0 && !isValidPhone(newPhone.trim())
			? "Masukkan nomor HP yang valid"
			: null;
	const newEmailError =
		newEmail.trim().length > 0 && !isValidEmail(newEmail.trim())
			? "Masukkan email yang valid"
			: null;

	const customerValid =
		customerMode === "new"
			? newName.trim().length > 0 &&
				isValidEmail(newEmail.trim()) &&
				!newPhoneError
			: customer !== null;

	const hasValidItem = items.some(
		(row) => row.productId !== null && row.qty > 0,
	);

	const canSubmit = customerValid && hasValidItem;

	// Auto-isi ongkir dari zona saat kota berubah (kecuali di-override manual).
	useEffect(() => {
		if (shippingManual) return;
		setShippingCost(
			shipCity.trim() ? getShippingZoneByCity(shipCity).baseRate : "",
		);
	}, [shipCity, shippingManual]);

	// ----- Handler item -----
	const addItem = () =>
		setItems((prev) => [
			...prev,
			{ key: crypto.randomUUID(), productId: null, qty: 1 },
		]);

	const removeItem = (key: string) =>
		setItems((prev) => prev.filter((row) => row.key !== key));

	const updateItem = (key: string, patch: Partial<ItemRow>) =>
		setItems((prev) =>
			prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
		);

	// ----- Handler customer -----
	const pickDifferent = () => {
		setCustomer(null);
		setCustomerMode("search");
	};

	const startNewCustomer = (name = "") => {
		setCustomer(null);
		setNewName(name);
		setCustomerMode("new");
	};

	// ----- Submit -----
	const handleSubmit = () => {
		if (!canSubmit) return;

		// 1. Tentukan customer — buat baru bila mode "new".
		let cust: Customer;
		if (customerMode === "new") {
			cust = {
				id: Date.now(),
				name: newName.trim(),
				email: newEmail.trim(),
				phone: newPhone.trim() || undefined,
				avatarColor: "teal",
				ordersCount: 0,
				lifetimeValue: 0,
				lastOrderAt: null,
				joinedAt: new Date().toISOString().slice(0, 10),
				segment: "new",
			};
			dummyCustomers.unshift(cust);
		} else {
			// customerValid menjamin customer !== null di sini.
			cust = customer as Customer;
		}

		// 2. Susun OrderItem dari baris yang valid.
		const orderItems: OrderItem[] = items.flatMap((row) => {
			if (row.productId === null || row.qty <= 0) return [];
			const product = dummyProducts.find((p) => p.id === row.productId);
			if (!product) return [];
			return [
				{
					productName: product.name,
					thumbnail: product.image,
					qty: row.qty,
					sku: product.sku,
					unitPrice: product.price,
				},
			];
		});

		// 3. Susun objek Order.
		const shipping = Number(shippingCost) || 0;
		const newOrder: Order = {
			id: `ORD-${Date.now()}`,
			customerName: cust.name,
			customerAvatarColor: cust.avatarColor ?? "teal",
			items: orderItems,
			date: orderDate,
			subtotal,
			shipping,
			total,
			status: "pending",
			customer: {
				id: cust.id,
				name: cust.name,
				email: cust.email,
				phone: cust.phone,
			},
			shippingInfo: {
				recipient: cust.name,
				addressLines: [street, shipCity].filter(Boolean),
				province: shipProvince.trim() || undefined,
				postCode: shipPostCode.trim() || undefined,
			},
			notes: notes.trim() || undefined,
		};

		// 4. Persist ke sumber dummy (muncul paling atas di /orders).
		dummyOrders.unshift(newOrder);

		// 5. Notifikasi + pindah ke detail order.
		notify.success(newOrder.id, "Order created");
		navigate(`/orders/${newOrder.id}`);
	};

	const showPickDifferent = customer !== null || customerMode === "new";
	const singleItem = items.length <= 1;

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/pos")}>
					Point of Sale
				</Anchor>
				<Text size="sm" c="dimmed">
					Create Order
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Create Order"
				subtitle="Buat order baru secara manual"
			/>

			<Grid gap="md">
				{/* Kolom kiri: order date, item, ringkasan total */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap="md">
						<Card withBorder>
							<DateInput
								label="Order date"
								valueFormat="DD MMM YYYY"
								w={220}
								value={orderDate || null}
								onChange={(val) => setOrderDate(val ?? "")}
								mb="md"
							/>
							<Divider mb="md" />
							<Group justify="space-between" mb="md">
								<Text fw={700} size="sm">
									Items *
								</Text>
								<Button
									variant="light"
									size="compact-sm"
									leftSection={<IconPlus size={14} />}
									onClick={addItem}
								>
									Add item
								</Button>
							</Group>

							<Stack gap="sm">
								<Group wrap="nowrap" gap="sm" px={2}>
									<Text flex={1} size="xs" fw={600} c="dimmed">
										Product
									</Text>
									<Text w={90} ta="center" size="xs" fw={600} c="dimmed">
										Qty
									</Text>
									<Text w={130} ta="right" size="xs" fw={600} c="dimmed">
										Subtotal
									</Text>
									<div style={{ width: 34 }} />
								</Group>

								{items.map((row) => {
									const product =
										row.productId !== null
											? productById.get(row.productId)
											: undefined;
									const lineTotal = product ? product.price * row.qty : 0;
									return (
										<Group key={row.key} align="center" wrap="nowrap" gap="sm">
											<Select
												flex={1}
												placeholder="Select product"
												searchable
												nothingFoundMessage="No product found"
												data={productOptions}
												value={
													row.productId !== null ? String(row.productId) : null
												}
												onChange={(val) =>
													updateItem(row.key, {
														productId: val ? Number(val) : null,
													})
												}
												filter={({ options, search }) => {
													const q = search.trim().toLowerCase();
													if (!q) return options;
													return options.filter((opt) => {
														if (!("value" in opt)) return false;
														const p = productById.get(Number(opt.value));
														return (
															!!p &&
															(p.name.toLowerCase().includes(q) ||
																p.sku.toLowerCase().includes(q))
														);
													});
												}}
												renderOption={({ option }) => {
													const p = productById.get(Number(option.value));
													if (!p) return <Text size="sm">{option.label}</Text>;
													const outOfStock = p.stock <= 0;
													return (
														<Group gap="sm" wrap="nowrap" w="100%">
															<Image
																src={p.image}
																alt={p.name}
																w={40}
																h={40}
																radius="sm"
																fit="cover"
															/>
															<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
																<Text size="sm" fw={500} lineClamp={1}>
																	{p.name}
																</Text>
																<Text
																	size="xs"
																	c={outOfStock ? "red" : "dimmed"}
																	lineClamp={1}
																>
																	{p.sku} ·{" "}
																	{outOfStock
																		? "Out of stock"
																		: `Stock ${p.stock}`}
																</Text>
															</Stack>
															<Text size="sm" fw={600}>
																{formatCurrency(p.price)}
															</Text>
														</Group>
													);
												}}
											/>
											<NumberInput
												w={90}
												min={1}
												value={row.qty}
												onChange={(val) =>
													updateItem(row.key, { qty: Number(val) || 1 })
												}
											/>
											<Text w={130} ta="right" size="sm" fw={600}>
												{formatCurrency(lineTotal)}
											</Text>
											<div
												style={{
													width: 34,
													display: "flex",
													justifyContent: "center",
												}}
											>
												{!singleItem && (
													<ActionIcon
														variant="subtle"
														color="red"
														size="lg"
														onClick={() => removeItem(row.key)}
														aria-label="Remove item"
													>
														<IconTrash size={16} />
													</ActionIcon>
												)}
											</div>
										</Group>
									);
								})}
							</Stack>
						</Card>

						{/* ---------- Ringkasan total ---------- */}
						<Card withBorder>
							<Stack gap="xs">
								<Group justify="space-between">
									<Text size="sm" c="dimmed">
										Subtotal
									</Text>
									<Text size="sm">{formatCurrency(subtotal)}</Text>
								</Group>
								<Group justify="space-between">
									<Text size="sm" c="dimmed">
										Shipping
									</Text>
									<Text size="sm">
										{formatCurrency(Number(shippingCost) || 0)}
									</Text>
								</Group>
								<Divider />
								<Group justify="space-between">
									<Text fw={700}>Total</Text>
									<Text fw={700}>{formatCurrency(total)}</Text>
								</Group>
							</Stack>
						</Card>
					</Stack>
				</Grid.Col>

				{/* Kolom kanan: customer, shipping, notes */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap="md">
						{/* ---------- Customer ---------- */}
						<Card withBorder>
							<Group justify="space-between" mb="md">
								<Text fw={700} size="sm">
									Customer *
								</Text>
								{showPickDifferent ? (
									<Button
										variant="subtle"
										size="compact-sm"
										leftSection={<IconArrowLeft size={14} />}
										onClick={pickDifferent}
									>
										Pick different
									</Button>
								) : (
									<Button
										variant="light"
										size="compact-sm"
										leftSection={<IconUserPlus size={14} />}
										onClick={() => startNewCustomer()}
									>
										New customer
									</Button>
								)}
							</Group>

							{customer ? (
								// b. Sudah memilih — kartu ringkas.
								<Group gap="sm" wrap="nowrap">
									<CustomerAvatar
										name={customer.name}
										color={customer.avatarColor}
									/>
									<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
										<Text size="sm" fw={500} lineClamp={1}>
											{customer.name}
										</Text>
										<Text size="xs" c="dimmed" lineClamp={1}>
											{contactLine(customer)}
										</Text>
									</Stack>
									<SegmentBadge segment={customer.segment} />
								</Group>
							) : customerMode === "new" ? (
								// c. Mode customer baru.
								<Stack gap="sm">
									<TextInput
										label="Name *"
										placeholder="e.g. Andi Wijaya"
										value={newName}
										onChange={(e) => setNewName(e.currentTarget.value)}
									/>
									<TextInput
										label="Email *"
										placeholder="e.g. andi@gmail.com"
										type="email"
										value={newEmail}
										onChange={(e) => setNewEmail(e.currentTarget.value)}
										error={newEmailError}
									/>
									<TextInput
										label="Phone"
										placeholder="0812-3456-7890"
										inputMode="tel"
										value={newPhone}
										onChange={(e) => setNewPhone(e.currentTarget.value)}
										error={newPhoneError}
									/>
									<Text size="xs" c="dimmed">
										Customer baru akan tersimpan di daftar customer.
									</Text>
								</Stack>
							) : (
								// a. Belum memilih — cari dari daftar.
								<Stack gap="sm">
									<TextInput
										leftSection={<IconSearch size={16} />}
										placeholder="Search by name, email or phone…"
										value={customerSearch}
										onChange={(e) => {
											setCustomerSearch(e.currentTarget.value);
											setCustomerMode("search");
										}}
									/>
									<ScrollArea.Autosize mah={260}>
										<Stack gap={4}>
											{customerResults.length > 0 ? (
												customerResults.map((c) => (
													<UnstyledButton
														key={c.id}
														onClick={() => setCustomer(c)}
														p="xs"
														style={{
															borderRadius: "var(--mantine-radius-sm)",
															width: "100%",
														}}
													>
														<Group gap="sm" wrap="nowrap">
															<CustomerAvatar
																name={c.name}
																color={c.avatarColor}
															/>
															<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
																<Text size="sm" fw={500} lineClamp={1}>
																	{c.name}
																</Text>
																<Text size="xs" c="dimmed" lineClamp={1}>
																	{contactLine(c)}
																</Text>
															</Stack>
															<SegmentBadge segment={c.segment} />
														</Group>
													</UnstyledButton>
												))
											) : (
												<UnstyledButton
													onClick={() =>
														startNewCustomer(customerSearch.trim())
													}
													p="xs"
													style={{
														borderRadius: "var(--mantine-radius-sm)",
														width: "100%",
													}}
												>
													<Group gap="sm" wrap="nowrap">
														<IconUserPlus size={18} />
														<Text size="sm">
															add “{customerSearch.trim()}” as new customer
														</Text>
													</Group>
												</UnstyledButton>
											)}
										</Stack>
									</ScrollArea.Autosize>
								</Stack>
							)}
						</Card>

						{/* ---------- Shipping address ---------- */}
						<Card withBorder>
							<Text fw={700} size="sm" mb="md">
								Shipping address
							</Text>
							<Stack gap="sm">
								<TextInput
									label="Street / building / apartment"
									placeholder="Jl. Contoh No. 1, Blok A"
									value={street}
									onChange={(e) => setStreet(e.currentTarget.value)}
								/>
								<Autocomplete
									label="City"
									placeholder="Jakarta"
									data={knownCities}
									value={shipCity}
									onChange={setShipCity}
								/>
								<Group grow align="flex-start">
									<Autocomplete
										label="Province"
										placeholder="DKI Jakarta"
										data={knownProvinces}
										value={shipProvince}
										onChange={setShipProvince}
									/>
									<TextInput
										label="Post code"
										placeholder="12190"
										inputMode="numeric"
										value={shipPostCode}
										onChange={(e) => setShipPostCode(e.currentTarget.value)}
									/>
								</Group>
								<NumberInput
									label={
										<Group gap="xs">
											<Text size="sm" component="span">
												Shipping cost (IDR)
											</Text>
											{shippingManual && (
												<Anchor
													size="xs"
													onClick={() => setShippingManual(false)}
												>
													reset to auto
												</Anchor>
											)}
										</Group>
									}
									min={0}
									thousandSeparator="."
									decimalSeparator=","
									value={shippingCost}
									onChange={(val) => {
										setShippingManual(true);
										setShippingCost(val === "" ? "" : Number(val));
									}}
								/>
								<Group justify="space-between">
									<Text size="xs" c="dimmed">
										{zone.name} · {zone.etaDays} ·{" "}
										{formatCurrency(zone.baseRate)}
									</Text>
									<Badge
										variant="light"
										color={shippingManual ? "orange" : "gray"}
									>
										{shippingManual ? "manual override" : "auto"}
									</Badge>
								</Group>
							</Stack>
						</Card>

						{/* ---------- Notes ---------- */}
						<Textarea
							label="Internal notes (optional)"
							placeholder="Catatan internal untuk order ini…"
							autosize
							minRows={3}
							value={notes}
							onChange={(e) => setNotes(e.currentTarget.value)}
						/>

						{/* ---------- Aksi ---------- */}
						<Stack gap="sm">
							<Button
								fullWidth
								size="lg"
								disabled={!canSubmit}
								onClick={handleSubmit}
							>
								Create order · {formatCurrency(total)}
							</Button>
							<Button
								variant="default"
								fullWidth
								onClick={() => navigate("/orders")}
							>
								Cancel
							</Button>
						</Stack>
					</Stack>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
