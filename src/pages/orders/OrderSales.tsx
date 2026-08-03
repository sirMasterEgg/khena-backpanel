import { zodResolver } from "@hookform/resolvers/zod";
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
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import {
	IconChevronRight,
	IconPlus,
	IconTrash,
	IconUserPlus,
	IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { listOrderSalesVariants } from "@/api/orderSales";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { CustomerPickerModal } from "@/pages/customers/CustomerPickerModal";
import type { PickedCustomer } from "@/pages/customers/pickedCustomer";
import { SegmentBadge } from "@/pages/customers/SegmentBadge";
import { formatCurrency } from "./format";
import {
	type OrderSalesFormData,
	orderSalesSchema,
} from "./orderSalesSchema";
import {
	getShippingZoneByCity,
	knownCities,
	knownProvinces,
} from "./shippingZones";

const emptyFormValues: OrderSalesFormData = {
	customerId: "",
	orderDate: new Date().toISOString().slice(0, 10),
	paymentMethod: "transfer",
	shippingAddress: "",
	shippingCity: "",
	shippingProvince: "",
	shippingZipCode: "",
	internalNote: "",
	items: [
		{
			detailProductId: "",
			variantName: "",
			sku: "",
			price: 0,
			stock: 0,
			quantity: 1,
		},
	],
};

export function OrderSales() {
	usePageTitle("Create Order");
	const navigate = useNavigate();

	// ----- Customer (tampilan kartu; nilai form ada di field customerId) -----
	const [customer, setCustomer] = useState<PickedCustomer | null>(null);
	const [pickerOpened, setPickerOpened] = useState(false);

	const {
		control,
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<OrderSalesFormData>({
		resolver: zodResolver(orderSalesSchema),
		defaultValues: emptyFormValues,
	});
	const { fields, append, remove } = useFieldArray({ control, name: "items" });

	const handlePickCustomer = (picked: PickedCustomer) => {
		setCustomer(picked);
		setValue("customerId", picked.id, { shouldValidate: true });
	};

	const clearCustomer = () => {
		setCustomer(null);
		setValue("customerId", "");
	};

	// ----- Katalog varian (search server-side) -----
	const [variantSearch, setVariantSearch] = useState("");
	const [debouncedVariantSearch] = useDebouncedValue(variantSearch, 300);

	const variantsQuery = useQuery({
		queryKey: ["order-sales-variants", { search: debouncedVariantSearch }],
		// Kontrak memisahkan pencarian nama produk dan SKU jadi dua param.
		// Satu kolom search di UI → kirim ke `name` saja.
		// TODO(backend): minta param gabungan yang mencari di nama ATAU SKU.
		queryFn: () =>
			listOrderSalesVariants({
				name: debouncedVariantSearch || undefined,
				limit: 20,
			}),
	});
	const variants = variantsQuery.data?.data ?? [];

	const watchedItems = watch("items");
	const subtotal = watchedItems.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	// ----- Shipping (masih memakai tarif dummy — diganti Tahap 7) -----
	const [street, setStreet] = useState("");
	const [shipCity, setShipCity] = useState("");
	const [shipProvince, setShipProvince] = useState("");
	const [shipPostCode, setShipPostCode] = useState("");
	const [shippingCost, setShippingCost] = useState<number | "">("");
	const [shippingManual, setShippingManual] = useState(false);

	const zone = getShippingZoneByCity(shipCity);

	useEffect(() => {
		if (shippingManual) return;
		setShippingCost(
			shipCity.trim() ? getShippingZoneByCity(shipCity).baseRate : "",
		);
	}, [shipCity, shippingManual]);

	const total = subtotal + (Number(shippingCost) || 0);

	// ----- Handler item -----
	const addItem = () =>
		append({
			detailProductId: "",
			variantName: "",
			sku: "",
			price: 0,
			stock: 0,
			quantity: 1,
		});

	const singleItem = fields.length <= 1;

	// TODO(Tahap 8): ganti dengan useMutation ke POST /order-sales + modal ringkasan.
	const onSubmit = (_data: OrderSalesFormData) => {
		void street;
		void shipProvince;
		void shipPostCode;
	};

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
							<Controller
								control={control}
								name="orderDate"
								render={({ field }) => (
									<DateInput
										label="Order date"
										valueFormat="DD MMM YYYY"
										w={220}
										value={field.value || null}
										onChange={(val) => field.onChange(val ?? "")}
										mb="md"
									/>
								)}
							/>
							<Divider mb="md" />
							<Group justify="space-between" mb="md">
								<Text fw={700} size="sm">
									Items *
								</Text>
								<Button
									type="button"
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

								{fields.map((field, index) => {
									const item = watchedItems[index];
									const lineTotal = item ? item.price * item.quantity : 0;
									return (
										<Group key={field.id} align="center" wrap="nowrap" gap="sm">
											<Controller
												control={control}
												name={`items.${index}.detailProductId`}
												render={({ field: f }) => (
													<Select
														flex={1}
														placeholder="Select product"
														searchable
														searchValue={variantSearch}
														onSearchChange={setVariantSearch}
														// Pencarian dilakukan server — matikan filter bawaan
														// Mantine, kalau tidak hasil server ikut tersaring
														// lagi di client dan bisa kosong.
														filter={({ options }) => options}
														nothingFoundMessage={
															variantsQuery.isLoading
																? "Loading…"
																: "No product found"
														}
														data={variants.map((v) => ({
															value: v.detailProductId,
															label: v.variantName,
														}))}
														value={f.value || null}
														onChange={(value) => {
															const picked = variants.find(
																(v) => v.detailProductId === value,
															);
															if (!picked) return;
															setValue(
																`items.${index}`,
																{
																	detailProductId: picked.detailProductId,
																	variantName: picked.variantName,
																	sku: picked.sku,
																	price: picked.price,
																	stock: picked.stock,
																	quantity: 1,
																},
																{ shouldValidate: true },
															);
														}}
														renderOption={({ option }) => {
															const v = variants.find(
																(candidate) =>
																	candidate.detailProductId === option.value,
															);
															if (!v) return <Text size="sm">{option.label}</Text>;
															const outOfStock = v.stock <= 0;
															return (
																<Group gap="sm" wrap="nowrap" w="100%">
																	{v.imageUrl ? (
																		<Image
																			src={v.imageUrl}
																			alt={v.variantName}
																			w={40}
																			h={40}
																			radius="sm"
																			fit="cover"
																		/>
																	) : (
																		<div
																			style={{
																				width: 40,
																				height: 40,
																				borderRadius: "var(--mantine-radius-sm)",
																				background: "var(--mantine-color-gray-2)",
																			}}
																		/>
																	)}
																	<Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
																		<Text size="sm" fw={500} lineClamp={1}>
																			{v.variantName}
																		</Text>
																		<Text
																			size="xs"
																			c={outOfStock ? "red" : "dimmed"}
																			lineClamp={1}
																		>
																			{v.sku} ·{" "}
																			{outOfStock ? "Out of stock" : `Stock ${v.stock}`}
																		</Text>
																	</Stack>
																	<Text size="sm" fw={600}>
																		{formatCurrency(v.price)}
																	</Text>
																</Group>
															);
														}}
														error={errors.items?.[index]?.detailProductId?.message}
													/>
												)}
											/>
											<Controller
												control={control}
												name={`items.${index}.quantity`}
												render={({ field: f }) => (
													<NumberInput
														w={90}
														min={1}
														max={item?.stock || undefined}
														value={f.value}
														onChange={(val) => f.onChange(Number(val) || 1)}
														error={errors.items?.[index]?.quantity?.message}
													/>
												)}
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
														type="button"
														variant="subtle"
														color="red"
														size="lg"
														onClick={() => remove(index)}
														aria-label="Remove item"
													>
														<IconTrash size={16} />
													</ActionIcon>
												)}
											</div>
										</Group>
									);
								})}
								{(errors.items?.root?.message || errors.items?.message) && (
									<Text c="red" size="sm">
										{errors.items?.root?.message ?? errors.items?.message}
									</Text>
								)}
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
							<Text fw={700} size="sm" mb="md">
								Customer *
							</Text>

							{customer ? (
								<Group gap="sm" wrap="nowrap">
									<CustomerAvatar name={customer.name} />
									<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
										<Text size="sm" fw={500} lineClamp={1}>
											{customer.name}
										</Text>
										<Group gap="xs">
											{customer.segment && (
												<SegmentBadge segment={customer.segment} />
											)}
											{customer.phone && (
												<Text size="xs" c="dimmed">
													{customer.phone}
												</Text>
											)}
										</Group>
									</Stack>
									<ActionIcon
										type="button"
										variant="subtle"
										color="gray"
										onClick={clearCustomer}
									>
										<IconX size={16} />
									</ActionIcon>
								</Group>
							) : (
								<Button
									type="button"
									variant="default"
									fullWidth
									justify="space-between"
									leftSection={<IconUserPlus size={16} />}
									rightSection={<IconChevronRight size={16} />}
									onClick={() => setPickerOpened(true)}
								>
									Select customer
								</Button>
							)}
							{errors.customerId?.message && (
								<Text c="red" size="xs" mt="xs">
									{errors.customerId.message}
								</Text>
							)}
						</Card>

						{/* ---------- Shipping address (tarif dummy — Tahap 7 mengganti) ---------- */}
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
							{...register("internalNote")}
						/>

						{/* ---------- Aksi ---------- */}
						<Stack gap="sm">
							<Button
								type="button"
								fullWidth
								size="lg"
								onClick={handleSubmit(onSubmit)}
							>
								Create order · {formatCurrency(total)}
							</Button>
							<Button
								type="button"
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

			<CustomerPickerModal
				opened={pickerOpened}
				onClose={() => setPickerOpened(false)}
				onSelect={handlePickCustomer}
			/>
		</Container>
	);
}
