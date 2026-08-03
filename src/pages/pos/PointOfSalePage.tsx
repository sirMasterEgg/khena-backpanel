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
	Loader,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
	IconChevronRight,
	IconSearch,
	IconShoppingCart,
	IconShoppingCartOff,
	IconUserPlus,
	IconX,
} from "@tabler/icons-react";
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { listCategories } from "@/api/categories";
import { getApiErrorMessage } from "@/api/client";
import {
	createPosOrder,
	listPosVariants,
	type PosVariant,
} from "@/api/pointOfSales";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { SegmentBadge } from "@/pages/customers/SegmentBadge";
import { CartItemRow } from "./CartItemRow";
import { CustomerPickerModal } from "./CustomerPickerModal";
import { formatCurrency } from "./format";
import { ProductCard } from "./ProductCard";
import {
	type CartItem,
	type CompletedSale,
	type PaymentMethod,
	POS_METHOD_MAP,
	type PosCustomer,
} from "./posTypes";
import { openReceiptModal } from "./ReceiptModal";
import { TakePaymentModal } from "./TakePaymentModal";

const PAGE_SIZE = 24;

export function PointOfSalePage() {
	usePageTitle("Point of Sale");
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [cart, setCart] = useState<CartItem[]>([]);
	const [customer, setCustomer] = useState<PosCustomer | null>(null);
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [categoryId, setCategoryId] = useState<string | null>(null);
	const [pickerOpened, setPickerOpened] = useState(false);
	const [paymentOpened, setPaymentOpened] = useState(false);

	// ----- Katalog varian (paginasi "Load more") -----

	const variantsQuery = useInfiniteQuery({
		queryKey: ["pos-variants", { search: debouncedSearch, categoryId }],
		queryFn: ({ pageParam }) =>
			listPosVariants({
				// Kontrak memisahkan pencarian nama produk dan SKU jadi dua param.
				// Satu kolom search di UI → kirim ke `name` saja.
				// TODO(backend): minta param gabungan (mis. `search`) yang mencari
				// di nama ATAU SKU supaya kasir bisa scan/ketik SKU juga.
				name: debouncedSearch || undefined,
				categoryId: categoryId ?? undefined,
				page: pageParam,
				limit: PAGE_SIZE,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.meta.page < lastPage.meta.totalPages
				? lastPage.meta.page + 1
				: undefined,
	});
	const variants = variantsQuery.data?.pages.flatMap((p) => p.data) ?? [];

	// ----- Filter kategori -----

	const categoriesQuery = useQuery({
		queryKey: ["categories", { forFilter: true }],
		// limit besar: dropdown butuh semua kategori, bukan 10 pertama.
		queryFn: () => listCategories({ limit: 100 }),
	});
	const categoryOptions = (categoriesQuery.data?.data ?? []).map((c) => ({
		value: c.id,
		label: c.category, // PERHATIKAN: `category`, bukan `name`
	}));

	// Nilai turunan keranjang.
	const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
	const total = cart.reduce(
		(sum, item) => sum + item.variant.price * item.qty,
		0,
	);

	/** Qty varian tertentu yang sudah ada di keranjang (untuk badge kartu). */
	const qtyInCart = (detailProductId: string) =>
		cart.find((item) => item.variant.detailProductId === detailProductId)
			?.qty ?? 0;

	// ----- Handler keranjang -----

	const addToCart = (variant: PosVariant) => {
		if (variant.stock === 0) return;
		setCart((prev) => {
			const existing = prev.find(
				(item) => item.variant.detailProductId === variant.detailProductId,
			);
			if (existing) {
				// Jangan melebihi stok tersedia.
				if (existing.qty >= variant.stock) return prev;
				return prev.map((item) =>
					item.variant.detailProductId === variant.detailProductId
						? { ...item, qty: item.qty + 1 }
						: item,
				);
			}
			return [...prev, { variant, qty: 1 }];
		});
	};

	const incQty = (detailProductId: string) => {
		setCart((prev) =>
			prev.map((item) =>
				item.variant.detailProductId === detailProductId &&
				item.qty < item.variant.stock
					? { ...item, qty: item.qty + 1 }
					: item,
			),
		);
	};

	const decQty = (detailProductId: string) => {
		setCart((prev) =>
			prev.flatMap((item) => {
				if (item.variant.detailProductId !== detailProductId) return [item];
				// Qty turun ke 0 → hapus item.
				return item.qty <= 1 ? [] : [{ ...item, qty: item.qty - 1 }];
			}),
		);
	};

	const removeItem = (detailProductId: string) => {
		setCart((prev) =>
			prev.filter((item) => item.variant.detailProductId !== detailProductId),
		);
	};

	const clearCart = () => setCart([]);

	// ----- Proses pembayaran -----

	const checkoutMutation = useMutation({
		mutationFn: (method: PaymentMethod) =>
			createPosOrder({
				// Walk-in: field customerId di-OMIT, bukan dikirim null.
				...(customer ? { customerId: customer.id } : {}),
				paymentMethod: POS_METHOD_MAP[method],
				items: cart.map((item) => ({
					detailProductId: item.variant.detailProductId,
					quantity: item.qty,
				})),
			}),
		onSuccess: (order) => {
			const customerName = customer?.name ?? null;
			notify.success(order.invoiceNumber, "Sale completed");
			setCart([]);
			setCustomer(null);
			setPaymentOpened(false);
			// Stok di katalog sudah berubah di server — tarik ulang.
			queryClient.invalidateQueries({ queryKey: ["pos-variants"] });
			const sale: CompletedSale = { order, customerName };
			openReceiptModal(sale);
		},
		onError: (error) => {
			notify.error(getApiErrorMessage(error));
			// "insufficient stock for ..." berarti stok yang ditampilkan sudah basi.
			// Refresh katalog supaya kasir melihat angka terbaru sebelum mencoba lagi.
			queryClient.invalidateQueries({ queryKey: ["pos-variants"] });
		},
	});

	const handleCharge = () => {
		if (cart.length === 0) return;
		setPaymentOpened(true);
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
			/>

			<Grid gap="md">
				{/* Kolom kiri: katalog produk */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Group mb="md" gap="sm">
						<TextInput
							flex={1}
							leftSection={<IconSearch size={16} />}
							placeholder="Search product"
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
						<Select
							data={categoryOptions}
							value={categoryId}
							onChange={setCategoryId}
							placeholder="All categories"
							w={200}
							clearable
						/>
					</Group>

					{variantsQuery.isLoading ? (
						<Center py={80}>
							<Loader />
						</Center>
					) : variantsQuery.isError ? (
						<Text c="red" ta="center" py={80}>
							{getApiErrorMessage(variantsQuery.error)}
						</Text>
					) : variants.length > 0 ? (
						<>
							<SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
								{variants.map((variant) => (
									<ProductCard
										key={variant.detailProductId}
										variant={variant}
										qtyInCart={qtyInCart(variant.detailProductId)}
										onAdd={() => addToCart(variant)}
									/>
								))}
							</SimpleGrid>

							{variantsQuery.hasNextPage && (
								<Center mt="md">
									<Button
										type="button"
										variant="light"
										onClick={() => variantsQuery.fetchNextPage()}
										loading={variantsQuery.isFetchingNextPage}
									>
										Load more
									</Button>
								</Center>
							)}
						</>
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
										variant="subtle"
										color="gray"
										onClick={() => setCustomer(null)}
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
												key={item.variant.detailProductId}
												item={item}
												onInc={() => incQty(item.variant.detailProductId)}
												onDec={() => decQty(item.variant.detailProductId)}
												onRemove={() =>
													removeItem(item.variant.detailProductId)
												}
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

								<Button
									type="button"
									fullWidth
									size="lg"
									disabled={cart.length === 0 || checkoutMutation.isPending}
									onClick={handleCharge}
								>
									Charge {formatCurrency(total)}
								</Button>
								<Button
									type="button"
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

			<CustomerPickerModal
				opened={pickerOpened}
				onClose={() => setPickerOpened(false)}
				onSelect={setCustomer}
			/>

			<TakePaymentModal
				opened={paymentOpened}
				onClose={() => setPaymentOpened(false)}
				total={total}
				itemCount={itemCount}
				customerName={customer?.name ?? null}
				loading={checkoutMutation.isPending}
				onPaid={(method) => checkoutMutation.mutate(method)}
			/>
		</Container>
	);
}
