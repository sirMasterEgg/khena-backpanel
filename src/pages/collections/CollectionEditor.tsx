import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Image,
	Loader,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
	IconArrowLeft,
	IconChevronDown,
	IconChevronUp,
	IconSearch,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import {
	type CollectionDetail,
	type CollectionInput,
	createCollection,
	getCollection,
	patchCollection,
} from "@/api/collections";
import { getMediaPreviewUrl, type MediaFile } from "@/api/media";
import { getProduct, listProducts, type ProductDetail } from "@/api/products";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import { type CollectionFormData, collectionSchema } from "./collectionSchema";

/** Label varian yang sudah dipilih — form hanya menyimpan id-nya. */
type VariantLabel = { name: string; sku: string };

/** Ke field mana hasil pilihan MediaPickerModal ditulis. */
type PickerTarget = "cover" | "hero";

const COVER_PLACEHOLDER = "https://placehold.co/600x400?text=No+Image";
const HERO_PLACEHOLDER = "https://placehold.co/1200x400?text=No+Image";

/** Mapping response GET /collections/:id → nilai form. */
function toFormValues(detail: CollectionDetail): CollectionFormData {
	return {
		name: detail.name,
		slug: detail.slug,
		status: detail.status,
		coverId: detail.coverImage?.id ?? "",
		heroId: detail.bannerImage?.id ?? "",
		// `products` sudah terurut by `order` dari server.
		productIds: detail.products.map((p) => p.id),
	};
}

export function CollectionEditor() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { id } = useParams();
	const isEdit = Boolean(id);

	usePageTitle(isEdit ? "Edit Collection" : "Add Collection");

	const {
		control,
		register,
		handleSubmit,
		watch,
		setValue,
		setError,
		reset,
		formState: { errors },
	} = useForm<CollectionFormData>({
		resolver: zodResolver(collectionSchema),
		defaultValues: {
			name: "",
			slug: "",
			status: "draft",
			coverId: "",
			heroId: "",
			productIds: [],
		},
	});

	// Katalog label varian terpilih (id → nama+sku) — form hanya menyimpan id.
	const [variantLabels, setVariantLabels] = useState<
		Record<string, VariantLabel>
	>({});
	// Preview gambar hasil picker; fallback ke url dari response detail.
	const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
	const [coverPreview, setCoverPreview] = useState<string | null>(null);
	const [heroPreview, setHeroPreview] = useState<string | null>(null);

	// Mode EDIT: load detail lalu prefill form lewat reset() di effect bawah.
	const detailQuery = useQuery({
		queryKey: ["collections", id],
		queryFn: () => getCollection(id as string),
		enabled: isEdit,
	});

	const detail = detailQuery.data;
	useEffect(() => {
		if (!detail) return;
		reset(toFormValues(detail));
		setVariantLabels((prev) => {
			const next = { ...prev };
			for (const p of detail.products) {
				next[p.id] = { name: p.name, sku: p.sku };
			}
			return next;
		});
	}, [detail, reset]);

	// ------ Picker produk (2 level: produk → varian) ------
	// Kotak pencarian produk = filter UI sesaat, tetap pakai useState.
	const [productSearch, setProductSearch] = useState("");
	const [debouncedProductSearch] = useDebouncedValue(productSearch, 300);
	// Produk yang diklik user — dropdown pindah menampilkan varian-nya.
	const [pickedProduct, setPickedProduct] = useState<ProductDetail | null>(
		null,
	);
	const productIds = watch("productIds");

	const searchQuery = useQuery({
		queryKey: ["products", { search: debouncedProductSearch, forPicker: true }],
		queryFn: () => listProducts({ search: debouncedProductSearch, limit: 10 }),
		enabled: debouncedProductSearch.trim().length > 0,
	});
	const productSuggestions = searchQuery.data?.data ?? [];

	// Klik produk → fetch detail untuk mendapatkan daftar variannya.
	const pickProductMutation = useMutation({
		mutationFn: (productId: string) => getProduct(productId),
		onSuccess: (product) => setPickedProduct(product),
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const addVariant = (variantId: string, label: VariantLabel) => {
		if (!productIds.includes(variantId)) {
			setValue("productIds", [...productIds, variantId]);
		}
		setVariantLabels((prev) => ({ ...prev, [variantId]: label }));
		setPickedProduct(null);
		setProductSearch("");
	};

	const removeProduct = (variantId: string) => {
		setValue(
			"productIds",
			productIds.filter((pid) => pid !== variantId),
		);
	};

	const moveProduct = (index: number, direction: "up" | "down") => {
		const target = direction === "up" ? index - 1 : index + 1;
		if (target < 0 || target >= productIds.length) return;
		const next = [...productIds];
		[next[index], next[target]] = [next[target], next[index]];
		setValue("productIds", next);
	};

	const dropdownOpen = pickedProduct !== null || productSuggestions.length > 0;

	// ------ Media picker ------
	const handlePickMedia = (file: MediaFile) => {
		if (!pickerTarget) return;
		const url = getMediaPreviewUrl(file);
		if (pickerTarget === "cover") {
			setValue("coverId", file.id, { shouldValidate: true });
			setCoverPreview(url);
		} else {
			setValue("heroId", file.id, { shouldValidate: true });
			setHeroPreview(url);
		}
	};

	const coverSrc =
		coverPreview ??
		(detail?.coverImage ? getMediaPreviewUrl(detail.coverImage) : null) ??
		COVER_PLACEHOLDER;
	const heroSrc =
		heroPreview ??
		(detail?.bannerImage ? getMediaPreviewUrl(detail.bannerImage) : null) ??
		HERO_PLACEHOLDER;

	// ------ Submit ------
	const applyApiErrors = (err: unknown) => {
		// 422: taruh pesan di field yang tepat — path dari server sudah camelCase
		// sama dengan nama field form.
		const fieldErrors = getApiFieldErrors(err);
		const fieldNames = Object.keys(fieldErrors);
		for (const field of fieldNames) {
			setError(field as keyof CollectionFormData, {
				message: fieldErrors[field],
			});
		}
		if (fieldNames.length > 0) return;
		// Error bisnis 400 (slug already exists, cover/hero media not found,
		// product <id> not found) cukup lewat toast.
		notify.error(getApiErrorMessage(err));
	};

	const createMutation = useMutation({
		mutationFn: (body: CollectionInput) => createCollection(body),
		onSuccess: () => {
			notify.success("Collection dibuat");
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			navigate("/collections");
		},
		onError: applyApiErrors,
	});

	const updateMutation = useMutation({
		mutationFn: (body: CollectionInput) => patchCollection(id as string, body),
		onSuccess: () => {
			notify.success("Collection diperbarui");
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			navigate("/collections");
		},
		onError: applyApiErrors,
	});

	const isSaving = createMutation.isPending || updateMutation.isPending;

	const onSubmit = (data: CollectionFormData) => {
		// PATCH partial, tapi editor selalu menampilkan daftar lengkap — kirim
		// semua field supaya `productIds` (replace-all) sesuai yang terlihat.
		const body: CollectionInput = {
			name: data.name,
			slug: data.slug,
			status: data.status,
			coverId: data.coverId,
			heroId: data.heroId,
			productIds: data.productIds,
		};
		if (isEdit) {
			updateMutation.mutate(body);
		} else {
			createMutation.mutate(body);
		}
	};

	if (isEdit && detailQuery.isLoading) {
		return (
			<Container size="xl">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	// Termasuk `400 collection not found` (error.code NOT_FOUND).
	if (isEdit && detailQuery.isError) {
		return (
			<Container size="xl">
				<PageHeader
					title="Collection Not Found"
					actions={
						<Button
							variant="default"
							leftSection={<IconArrowLeft size={16} />}
							onClick={() => navigate("/collections")}
						>
							Back to Collections
						</Button>
					}
				/>
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						{getApiErrorMessage(detailQuery.error)}
					</Text>
				</Card>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<PageHeader
				title={isEdit ? "Edit Collection" : "Add Collection"}
				subtitle="Create a new collections and curate the products that define it."
				actions={
					<Group gap="sm">
						<Button
							variant="default"
							disabled={isSaving}
							onClick={() => navigate("/collections")}
						>
							Cancel
						</Button>
						<Button loading={isSaving} onClick={handleSubmit(onSubmit)}>
							Save
						</Button>
					</Group>
				}
			/>

			<Grid gap="lg">
				{/* KOLOM KIRI */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					{/* Group: Collection Information */}
					<Card withBorder mb="lg">
						<Stack gap="md">
							<Text fw={600}>Collection Information</Text>
							<TextInput
								label="Name"
								placeholder="Collection name"
								{...register("name")}
								error={errors.name?.message}
							/>
							<TextInput
								label="Slug"
								placeholder="collection-slug"
								{...register("slug")}
								error={errors.slug?.message}
							/>
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<Select
										label="Status"
										data={[
											{ value: "draft", label: "Draft" },
											{ value: "published", label: "Published" },
										]}
										value={field.value}
										onChange={field.onChange}
										error={errors.status?.message}
									/>
								)}
							/>
						</Stack>
					</Card>

					{/* Group: Products in Collection */}
					<Card withBorder>
						<Stack gap="md">
							<div>
								<Text fw={600}>Products in Collection</Text>
								<Text size="sm" c="dimmed">
									Type to find a product, pick one of its variants to add. Use
									the arrows to reorder.
								</Text>
							</div>

							{/* Search input */}
							<div style={{ position: "relative" }}>
								<TextInput
									placeholder="Search products..."
									leftSection={<IconSearch size={16} />}
									value={productSearch}
									onChange={(e) => {
										setProductSearch(e.currentTarget.value);
										// Ketikan baru = kembali ke mode pencarian produk.
										setPickedProduct(null);
									}}
								/>
								{/* Dropdown: hasil pencarian produk, atau varian dari
								    produk yang diklik (pickedProduct). */}
								{dropdownOpen && (
									<Card
										withBorder
										p="xs"
										style={{
											position: "absolute",
											zIndex: 10,
											width: "100%",
											marginTop: 4,
											maxHeight: 240,
											overflowY: "auto",
										}}
									>
										{pickedProduct ? (
											<Stack gap={4}>
												<Button
													variant="subtle"
													size="xs"
													justify="flex-start"
													leftSection={<IconArrowLeft size={14} />}
													onClick={() => setPickedProduct(null)}
												>
													Back
												</Button>
												{pickedProduct.variants.length === 0 && (
													<Text size="sm" c="dimmed" px="sm">
														No variants in this product.
													</Text>
												)}
												{pickedProduct.variants.map((variant) => (
													<Button
														key={variant.id}
														variant="subtle"
														justify="flex-start"
														fullWidth
														disabled={productIds.includes(variant.id)}
														onClick={() =>
															addVariant(variant.id, {
																name: pickedProduct.name,
																sku: variant.detailProductSku,
															})
														}
													>
														{pickedProduct.name} — {variant.detailProductSku}
													</Button>
												))}
											</Stack>
										) : (
											<Stack gap={4}>
												{productSuggestions.map((p) => (
													<Button
														key={p.id}
														variant="subtle"
														justify="flex-start"
														fullWidth
														loading={
															pickProductMutation.isPending &&
															pickProductMutation.variables === p.id
														}
														onClick={() => pickProductMutation.mutate(p.id)}
													>
														{p.name} ({p.baseSku})
													</Button>
												))}
											</Stack>
										)}
									</Card>
								)}
							</div>

							{/* List varian yang sudah ditambahkan */}
							<Stack
								gap="xs"
								style={{
									minHeight: 250,
								}}
							>
								{productIds.length === 0 && (
									<Text size="sm" c="dimmed">
										No products added yet.
									</Text>
								)}
								{productIds.map((pid, index) => {
									const label = variantLabels[pid];
									return (
										<Group key={pid} justify="space-between" wrap="nowrap">
											<Group gap="sm" wrap="nowrap">
												<Stack gap={2}>
													<ActionIcon
														size="sm"
														variant="subtle"
														color="gray"
														disabled={index === 0}
														onClick={() => moveProduct(index, "up")}
														aria-label="Move up"
													>
														<IconChevronUp size={14} />
													</ActionIcon>
													<ActionIcon
														size="sm"
														variant="subtle"
														color="gray"
														disabled={index === productIds.length - 1}
														onClick={() => moveProduct(index, "down")}
														aria-label="Move down"
													>
														<IconChevronDown size={14} />
													</ActionIcon>
												</Stack>
												<Text size="sm">
													{label ? `${label.name} — ${label.sku}` : pid}
												</Text>
											</Group>
											<Button
												size="xs"
												color="red"
												variant="subtle"
												leftSection={<IconTrash size={14} />}
												onClick={() => removeProduct(pid)}
											>
												Remove
											</Button>
										</Group>
									);
								})}
							</Stack>
						</Stack>
					</Card>
				</Grid.Col>

				{/* KOLOM KANAN */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					{/* Group: Cover Image */}
					<Card withBorder mb="lg">
						<Stack gap="md">
							<div>
								<Text fw={600}>Cover Image</Text>
								<Text size="sm" c="dimmed">
									The main image people see in the Collections list and on the
									storefront grid.
								</Text>
							</div>
							<Image src={coverSrc} alt="Cover preview" radius="md" />
							{errors.coverId && (
								<Text size="xs" c="red">
									{errors.coverId.message}
								</Text>
							)}
							<Button
								variant="default"
								onClick={() => setPickerTarget("cover")}
							>
								Choose image
							</Button>
						</Stack>
					</Card>

					{/* Group: Product Showcase Hero */}
					<Card withBorder>
						<Stack gap="md">
							<div>
								<Text fw={600}>Product Showcase Hero</Text>
								<Text size="sm" c="dimmed">
									Wide banner shown at the top of this collection's page on the
									storefront.
								</Text>
							</div>
							<Image src={heroSrc} alt="Hero preview" radius="md" />
							{errors.heroId && (
								<Text size="xs" c="red">
									{errors.heroId.message}
								</Text>
							)}
							<Button variant="default" onClick={() => setPickerTarget("hero")}>
								Choose image
							</Button>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>

			<MediaPickerModal
				opened={pickerTarget !== null}
				onClose={() => setPickerTarget(null)}
				onSelect={handlePickMedia}
			/>
		</Container>
	);
}
