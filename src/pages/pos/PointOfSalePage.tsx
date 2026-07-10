import {
	ActionIcon,
	Anchor,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Divider,
	Grid,
	Group,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import {
	IconChevronRight,
	IconSearch,
	IconShoppingCart,
	IconShoppingCartOff,
	IconUserPlus,
	IconX,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { type Customer, dummyProducts, type Product } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { SegmentBadge } from "@/pages/customers/SegmentBadge";
import { CartItemRow } from "./CartItemRow";
import { openCustomerPickerModal } from "./CustomerPickerModal";
import { formatCurrency } from "./format";
import { ProductCard } from "./ProductCard";
import type { CartItem, CompletedSale, PaymentMethod } from "./posTypes";
import { openReceiptModal } from "./ReceiptModal";
import { openTakePaymentModal } from "./TakePaymentModal";

export function PointOfSalePage() {
	usePageTitle("Point of Sale");
	const navigate = useNavigate();

	// Stok produk ditampung di state supaya penjualan bisa mengurangi stok.
	const [products, setProducts] = useState<Product[]>(() => [...dummyProducts]);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [customer, setCustomer] = useState<Customer | null>(null);
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<string>("all");

	// Kategori unik diturunkan dari data produk untuk dropdown filter.
	const categoryOptions = useMemo(() => {
		const unique = [...new Set(products.map((p) => p.category))].sort();
		return [
			{ value: "all", label: "All categories" },
			...unique.map((c) => ({ value: c, label: c })),
		];
	}, [products]);

	// Katalog ter-filter berdasarkan search (nama/SKU) dan kategori.
	const filteredProducts = useMemo(() => {
		const q = search.trim().toLowerCase();
		return products.filter((p) => {
			const matchesSearch =
				q.length === 0 ||
				p.name.toLowerCase().includes(q) ||
				p.sku.toLowerCase().includes(q);
			const matchesCategory = category === "all" || p.category === category;
			return matchesSearch && matchesCategory;
		});
	}, [products, search, category]);

	// Nilai turunan keranjang.
	const itemCount = useMemo(
		() => cart.reduce((sum, item) => sum + item.qty, 0),
		[cart],
	);
	const total = useMemo(
		() => cart.reduce((sum, item) => sum + item.product.price * item.qty, 0),
		[cart],
	);

	/** Qty produk tertentu yang sudah ada di keranjang (untuk badge kartu). */
	const qtyInCart = (productId: number) =>
		cart.find((item) => item.product.id === productId)?.qty ?? 0;

	// ----- Handler keranjang -----

	const addToCart = (product: Product) => {
		if (product.stock === 0) return;
		setCart((prev) => {
			const existing = prev.find((item) => item.product.id === product.id);
			if (existing) {
				// Jangan melebihi stok tersedia.
				if (existing.qty >= product.stock) return prev;
				return prev.map((item) =>
					item.product.id === product.id
						? { ...item, qty: item.qty + 1 }
						: item,
				);
			}
			return [...prev, { product, qty: 1 }];
		});
	};

	const incQty = (productId: number) => {
		setCart((prev) =>
			prev.map((item) =>
				item.product.id === productId && item.qty < item.product.stock
					? { ...item, qty: item.qty + 1 }
					: item,
			),
		);
	};

	const decQty = (productId: number) => {
		setCart((prev) =>
			prev.flatMap((item) => {
				if (item.product.id !== productId) return [item];
				// Qty turun ke 0 → hapus item.
				return item.qty <= 1 ? [] : [{ ...item, qty: item.qty - 1 }];
			}),
		);
	};

	const removeItem = (productId: number) => {
		setCart((prev) => prev.filter((item) => item.product.id !== productId));
	};

	const clearCart = () => setCart([]);

	// ----- Proses pembayaran -----

	const handleCharge = () => {
		if (cart.length === 0 || !customer) return;
		openTakePaymentModal({
			total,
			itemCount,
			customer,
			onPaid: (method: PaymentMethod) => {
				const sale: CompletedSale = {
					id: `POS-${Date.now()}`,
					items: cart,
					customer,
					total,
					itemCount,
					paymentMethod: method,
					createdAt: new Date().toISOString(),
				};

				// Kurangi stok tiap produk yang terjual (kebalikan "Receive stock").
				setProducts((prev) =>
					prev.map((p) => {
						const line = cart.find((item) => item.product.id === p.id);
						return line ? { ...p, stock: p.stock - line.qty } : p;
					}),
				);

				notify.success(sale.id, "Sale completed");
				setCart([]);
				setCustomer(null);
				openReceiptModal(sale);
			},
		});
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/pos")}>
					Point of Sale
				</Anchor>
			</Breadcrumbs>

			<PageHeader
				title="Point of Sale"
				subtitle="Ring up a sale, pick a customer, and take payment"
				actions={
					<Button
						variant="default"
						onClick={() => notify.info("Stock take coming soon")}
					>
						Stock take
					</Button>
				}
			/>

			<Grid gap="md">
				{/* Kolom kiri: katalog produk */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Group mb="md" gap="sm">
						<TextInput
							flex={1}
							leftSection={<IconSearch size={16} />}
							placeholder="Search product or SKU"
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
						<Select
							data={categoryOptions}
							value={category}
							onChange={(val) => setCategory(val ?? "all")}
							placeholder="All categories"
							w={200}
							allowDeselect={false}
						/>
					</Group>

					{filteredProducts.length > 0 ? (
						<SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
							{filteredProducts.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									qtyInCart={qtyInCart(product.id)}
									onAdd={() => addToCart(product)}
								/>
							))}
						</SimpleGrid>
					) : (
						<Center py={80}>
							<Stack align="center" gap="sm">
								<IconSearch size={36} color="var(--mantine-color-gray-5)" />
								<Text c="dimmed">No products found</Text>
							</Stack>
						</Center>
					)}
				</Grid.Col>

				{/* Kolom kanan: keranjang */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Card withBorder padding="md">
						<Stack gap="md">
							{/* A. Blok customer */}
							{customer ? (
								<Group gap="sm" wrap="nowrap">
									<CustomerAvatar
										name={customer.name}
										color={customer.avatarColor}
									/>
									<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
										<Text size="sm" fw={500} lineClamp={1}>
											{customer.name}
										</Text>
										<Group gap="xs">
											<SegmentBadge segment={customer.segment} />
											{customer.phone && (
												<Text size="xs" c="dimmed">
													{customer.phone}
												</Text>
											)}
										</Group>
									</Stack>
									<ActionIcon
										variant="subtle"
										color="gray"
										onClick={() => setCustomer(null)}
									>
										<IconX size={16} />
									</ActionIcon>
								</Group>
							) : (
								<Button
									variant="default"
									fullWidth
									justify="space-between"
									leftSection={<IconUserPlus size={16} />}
									rightSection={<IconChevronRight size={16} />}
									onClick={() => openCustomerPickerModal(setCustomer)}
								>
									Add a customer
								</Button>
							)}

							<Divider />

							{/* B. Daftar item */}
							{cart.length > 0 ? (
								<ScrollArea.Autosize mah={360}>
									<Stack gap="sm">
										{cart.map((item) => (
											<CartItemRow
												key={item.product.id}
												item={item}
												onInc={() => incQty(item.product.id)}
												onDec={() => decQty(item.product.id)}
												onRemove={() => removeItem(item.product.id)}
											/>
										))}
									</Stack>
								</ScrollArea.Autosize>
							) : (
								<Center py="xl">
									<Stack align="center" gap="sm">
										<IconShoppingCart
											size={36}
											color="var(--mantine-color-gray-5)"
										/>
										<Text c="dimmed">Cart is empty</Text>
									</Stack>
								</Center>
							)}

							<Divider />

							{/* C. Ringkasan */}
							<Stack gap="xs">
								<Group justify="space-between">
									<Text size="sm" c="dimmed">
										Items
									</Text>
									<Text size="sm">{itemCount}</Text>
								</Group>
								<Group justify="space-between">
									<Text fw={500}>Total</Text>
									<Text fw={700}>{formatCurrency(total)}</Text>
								</Group>

								{cart.length > 0 && !customer && (
									<Text c="red" size="sm">
										Add a customer to process payment
									</Text>
								)}

								<Button
									fullWidth
									size="lg"
									disabled={cart.length === 0 || !customer}
									onClick={handleCharge}
								>
									Charge {formatCurrency(total)}
								</Button>
								<Button
									variant="subtle"
									color="gray"
									fullWidth
									leftSection={<IconShoppingCartOff size={16} />}
									disabled={cart.length === 0}
									onClick={clearCart}
								>
									Clear cart
								</Button>
							</Stack>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
