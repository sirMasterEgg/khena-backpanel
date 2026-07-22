import { zodResolver } from "@hookform/resolvers/zod";
import {
	AspectRatio,
	Button,
	Card,
	Center,
	Checkbox,
	Container,
	Grid,
	Group,
	Image,
	Loader,
	NumberInput,
	Paper,
	Select,
	Stack,
	Tabs,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import {
	IconArrowLeft,
	IconChevronLeft,
	IconChevronRight,
	IconPlus,
	IconTrash,
	IconUpload,
	IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { listCareInstructions } from "@/api/careInstructions";
import { listCategories } from "@/api/categories";
import {
	getApiErrorMessage,
	getApiFieldErrors,
} from "@/api/client";
import { listCollections } from "@/api/collections";
import { listColors } from "@/api/colors";
import {
	getMediaDownloadUrl,
	getMediaPreviewUrl,
	type MediaFile,
} from "@/api/media";
import {
	createProduct,
	getProduct,
	patchProduct,
	type ProductDetail,
	type ProductInput,
	type ProductPatchInput,
} from "@/api/products";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { STATUS_OPTIONS, VISIBILITY_OPTIONS } from "@/config/productOptions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import { formatCurrency } from "./format";
import { type ProductFormData, productSchema } from "./productSchema";

// Order of the editor tabs, used by the Previous/Next footer navigation.
const TAB_ORDER = ["general", "materials", "dimension", "media"];

// Opsi dropdown butuh SEMUA data, bukan 10 pertama (default limit API).
const OPTIONS_LIMIT = 100;

const createEmptyVariant = () => ({
	id: undefined as string | undefined,
	colorId: "",
	sku: "",
	visibility: "visible" as const,
	price: 0,
	capitalPrice: 0,
	discountPercent: 0,
	comparePrice: 0,
	marketplacePrice: 0,
	initialStock: 0,
	images: [] as string[],
});

const emptyDimension = { image: "" } as ProductFormData["productDimension"];

/** Ke mana hasil pilihan MediaPickerModal ditulis di form. */
type PickerTarget =
	| { kind: "media" }
	| { kind: "productDimension" }
	| { kind: "boxDimension" }
	| { kind: "variant"; index: number };

/**
 * Nilai form → body POST /products. `comparePrice` (UI-only, tidak ada di API)
 * dan `id` varian dibuang dari payload create.
 */
function toProductInput(data: ProductFormData): ProductInput {
	return {
		productName: data.productName,
		baseSku: data.baseSku,
		collectionId: data.collectionId || undefined,
		categoryId: data.categoryId,
		status: data.status,
		description: data.description || undefined,
		lowStockAlert: data.lowStockAlert,
		materialInformation: data.materialInformation,
		careInstructionIds: data.careInstructionIds,
		productDimension: data.productDimension,
		boxDimension: data.boxDimension,
		media: data.media,
		variant: data.variant.map(
			({ id: _id, comparePrice: _comparePrice, ...variant }) => variant,
		),
	};
}

/**
 * Nilai form → body PATCH. Body dikirim lengkap (paling sederhana & aman),
 * kecuali `collectionId` yang tidak ada di response detail — kalau user tidak
 * memilih apa pun, field-nya tidak dikirim supaya tautan lama tidak berubah.
 * Semantik varian: ber-`id` = update, tanpa `id` = baru, yang dihapus dari
 * form di-soft-delete backend.
 */
function toProductPatchInput(data: ProductFormData): ProductPatchInput {
	return {
		...toProductInput(data),
		variant: data.variant.map(
			({ id, comparePrice: _comparePrice, ...variant }) =>
				id ? { id, ...variant } : variant,
		),
	};
}

/** Mapping response GET /products/:id → nilai form (kebalikan toProductInput). */
function toFormValues(detail: ProductDetail): ProductFormData {
	return {
		productName: detail.name,
		baseSku: detail.baseSku,
		// collectionId tidak ada di response detail — tidak bisa di-prefill.
		collectionId: "",
		categoryId: detail.category.id,
		status: detail.status ?? "draft",
		description: detail.description ?? "",
		lowStockAlert: detail.lowStockAlert ?? undefined,
		materialInformation: detail.materials ?? "",
		careInstructionIds: detail.careInstructions.map((c) => c.id),
		productDimension: {
			width: detail.productDimension.width,
			depth: detail.productDimension.depth,
			height: detail.productDimension.height,
			weight: detail.productDimension.weight,
			image: detail.productDimension.media?.id ?? "",
		},
		boxDimension: {
			width: detail.boxDimension.width,
			depth: detail.boxDimension.depth,
			height: detail.boxDimension.height,
			weight: detail.boxDimension.weight,
			image: detail.boxDimension.media?.id ?? "",
		},
		media: detail.media.map((f) => f.id),
		variant: detail.variants.map((v) => ({
			id: v.id,
			colorId: v.colorId,
			sku: v.detailProductSku,
			visibility: v.visibility,
			price: v.price,
			capitalPrice: v.capitalPrice,
			discountPercent: v.discountPercent ?? 0,
			comparePrice: 0, // UI-only; tampilannya dihitung saat render
			marketplacePrice: v.marketplacePrice ?? undefined,
			// initialStock tidak ada di response — backend mengabaikannya untuk
			// varian lama, inputnya di-disable.
			initialStock: 0,
			images: v.images.map((f) => f.id),
		})),
	};
}

/** Semua objek File di response detail → map id→File untuk preview. */
function collectMediaFiles(detail: ProductDetail): Record<string, MediaFile> {
	const map: Record<string, MediaFile> = {};
	for (const file of detail.media) map[file.id] = file;
	if (detail.productDimension.media) {
		map[detail.productDimension.media.id] = detail.productDimension.media;
	}
	if (detail.boxDimension.media) {
		map[detail.boxDimension.media.id] = detail.boxDimension.media;
	}
	for (const variant of detail.variants) {
		for (const file of variant.images) map[file.id] = file;
	}
	return map;
}

export function ProductEditor() {
	usePageTitle("Product");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { id } = useParams();
	const isNew = !id;

	const [activeTab, setActiveTab] = useState<string | null>("general");
	const currentTabIndex = TAB_ORDER.indexOf(activeTab ?? "general");
	const goToPrevTab = () => setActiveTab(TAB_ORDER[currentTabIndex - 1]);
	const goToNextTab = () => setActiveTab(TAB_ORDER[currentTabIndex + 1]);

	// Form menyimpan uuid media; objek File-nya (untuk URL preview) disimpan di
	// map ini. Id yang tidak ada di map jatuh ke getMediaDownloadUrl(id).
	const [mediaById, setMediaById] = useState<Record<string, MediaFile>>({});
	const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

	const previewUrl = (mediaId: string) => {
		const file = mediaById[mediaId];
		return file ? getMediaPreviewUrl(file) : getMediaDownloadUrl(mediaId);
	};

	// Mode EDIT: load detail lalu prefill form lewat reset() di effect bawah.
	const productQuery = useQuery({
		queryKey: ["products", id],
		queryFn: () => getProduct(id as string),
		enabled: !isNew,
	});

	const {
		control,
		handleSubmit,
		register,
		watch,
		setValue,
		setError,
		reset,
		formState: { errors },
	} = useForm<ProductFormData>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			productName: "",
			baseSku: "",
			collectionId: "",
			categoryId: "",
			status: "draft",
			description: "",
			lowStockAlert: 5,
			materialInformation: "",
			careInstructionIds: [],
			productDimension: emptyDimension,
			boxDimension: emptyDimension,
			media: [],
			// Start with one empty variant so the user can fill it in
			// without having to click "Add Variant" first.
			variant: [createEmptyVariant()],
		},
	});

	const {
		fields: variantFields,
		append: appendVariant,
		remove: removeVariant,
	} = useFieldArray({
		control,
		name: "variant",
	});

	// Prefill saat data detail datang (mode edit). Objek File dari response
	// dimasukkan ke map preview supaya <Image> punya URL siap pakai.
	const productDetail = productQuery.data;
	useEffect(() => {
		if (!productDetail) return;
		reset(toFormValues(productDetail));
		setMediaById((prev) => ({ ...prev, ...collectMediaFiles(productDetail) }));
	}, [productDetail, reset]);

	// Compare price & profit dihitung langsung dari nilai yang di-watch saat
	// render (bukan setValue di effect) — selalu sinkron dengan ketikan user.
	const variants = watch("variant");

	const media = watch("media");
	const productDimensionImage = watch("productDimension.image");
	const boxDimensionImage = watch("boxDimension.image");

	// ------ Opsi dropdown dari API ------
	const categoriesQuery = useQuery({
		queryKey: ["categories", { forOptions: true }],
		queryFn: () => listCategories({ limit: OPTIONS_LIMIT }),
	});
	const collectionsQuery = useQuery({
		queryKey: ["collections", { forOptions: true }],
		queryFn: () => listCollections({ limit: OPTIONS_LIMIT }),
	});
	const colorsQuery = useQuery({
		queryKey: ["colors", { forOptions: true }],
		queryFn: () => listColors({ limit: OPTIONS_LIMIT }),
	});
	const careInstructionsQuery = useQuery({
		queryKey: ["careInstructions"],
		queryFn: () => listCareInstructions({ limit: OPTIONS_LIMIT }),
	});

	const categoryOptions = (categoriesQuery.data?.data ?? []).map((c) => ({
		value: c.id,
		label: c.category,
	}));
	const collectionOptions = (collectionsQuery.data?.data ?? []).map((c) => ({
		value: c.id,
		label: c.name,
	}));
	const colorOptions = (colorsQuery.data?.data ?? []).map((c) => ({
		value: c.id,
		label: c.name,
	}));
	const careInstructionOptions = careInstructionsQuery.data?.data ?? [];

	// ------ Media picker ------
	const handlePickMedia = (file: MediaFile) => {
		setMediaById((prev) => ({ ...prev, [file.id]: file }));
		if (!pickerTarget) return;
		switch (pickerTarget.kind) {
			case "media":
				if (!media.includes(file.id)) setValue("media", [...media, file.id]);
				break;
			case "productDimension":
				setValue("productDimension.image", file.id);
				break;
			case "boxDimension":
				setValue("boxDimension.image", file.id);
				break;
			case "variant": {
				const current = variants?.[pickerTarget.index]?.images ?? [];
				if (!current.includes(file.id)) {
					setValue(`variant.${pickerTarget.index}.images`, [
						...current,
						file.id,
					]);
				}
				break;
			}
		}
	};

	// ------ Submit ------
	const applyApiErrors = (err: unknown) => {
		// 422: taruh pesan di field yang tepat. Path dari API ("variant.0.sku")
		// cocok dengan penamaan field react-hook-form.
		const fieldErrors = getApiFieldErrors(err);
		const fieldNames = Object.keys(fieldErrors);
		for (const field of fieldNames) {
			setError(field as keyof ProductFormData, {
				message: fieldErrors[field],
			});
		}
		if (fieldNames.length > 0) return;

		const message = getApiErrorMessage(err);
		// Error bisnis 400: kenali yang bisa ditempel ke field.
		if (message === "sku already exists") {
			setError("baseSku", { message });
			return;
		}
		const variantSkuMatch = message.match(/^variant sku (\S+) harus diawali/);
		if (variantSkuMatch) {
			const idx = variants.findIndex((v) => v.sku === variantSkuMatch[1]);
			if (idx >= 0) {
				setError(`variant.${idx}.sku`, { message });
				return;
			}
		}
		notify.error(message);
	};

	const createMutation = useMutation({
		mutationFn: (body: ProductInput) => createProduct(body),
		onSuccess: () => {
			notify.success("Product dibuat");
			queryClient.invalidateQueries({ queryKey: ["products"] });
			navigate("/products");
		},
		onError: applyApiErrors,
	});

	const patchMutation = useMutation({
		mutationFn: (body: ProductPatchInput) =>
			patchProduct(id as string, body),
		onSuccess: () => {
			notify.success("Product diperbarui");
			queryClient.invalidateQueries({ queryKey: ["products"] });
			queryClient.invalidateQueries({ queryKey: ["products", id] });
			navigate("/products");
		},
		onError: applyApiErrors,
	});

	const isSaving = createMutation.isPending || patchMutation.isPending;

	const onSubmit = (data: ProductFormData) => {
		if (isNew) {
			createMutation.mutate(toProductInput(data));
		} else {
			patchMutation.mutate(toProductPatchInput(data));
		}
	};

	if (!isNew && productQuery.isLoading) {
		return (
			<Container size="xl">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	// Termasuk `400 product not found` (error.code NOT_FOUND).
	if (!isNew && productQuery.isError) {
		return (
			<Container size="xl">
				<PageHeader
					title="Product Not Found"
					actions={
						<Button
							variant="default"
							leftSection={<IconArrowLeft size={16} />}
							onClick={() => navigate("/products")}
						>
							Back to Products
						</Button>
					}
				/>
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						{getApiErrorMessage(productQuery.error)}
					</Text>
				</Card>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<PageHeader
				title={isNew ? "Add Product" : "Edit Product"}
				actions={
					<Group>
						<Button
							variant="light"
							disabled={isSaving}
							onClick={() => navigate("/products")}
						>
							Cancel
						</Button>
						<Button loading={isSaving} onClick={handleSubmit(onSubmit)}>
							Save
						</Button>
					</Group>
				}
			/>

			<form onSubmit={handleSubmit(onSubmit)} noValidate>
				<Tabs value={activeTab} onChange={setActiveTab}>
					<Tabs.List>
						<Tabs.Tab value="general">General</Tabs.Tab>
						<Tabs.Tab value="materials">Materials & Care</Tabs.Tab>
						<Tabs.Tab value="dimension">Dimension</Tabs.Tab>
						<Tabs.Tab value="media">Media</Tabs.Tab>
					</Tabs.List>

					{/* TAB: GENERAL */}
					<Tabs.Panel value="general" pt="md">
						<Stack gap="md">
							{/* Product Information */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600}>Product Information</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{/* Product name - full width */}
										<TextInput
											label="Product Name"
											placeholder="Enter product name"
											{...register("productName")}
											error={errors.productName?.message}
										/>

										{/* SKU + Collection - side by side */}
										<Grid gap="md">
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<TextInput
													label="SKU"
													placeholder="Enter SKU"
													{...register("baseSku")}
													error={errors.baseSku?.message}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="collectionId"
													control={control}
													render={({ field }) => (
														<Select
															{...field}
															value={field.value || null}
															onChange={(val) => field.onChange(val ?? "")}
															label="Collection"
															placeholder="Select collection"
															data={collectionOptions}
															searchable
															clearable
															error={errors.collectionId?.message}
														/>
													)}
												/>
											</Grid.Col>
										</Grid>

										{/* Category + Status - side by side */}
										<Grid gap="md">
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="categoryId"
													control={control}
													render={({ field }) => (
														<Select
															{...field}
															value={field.value || null}
															onChange={(val) => field.onChange(val ?? "")}
															label="Category"
															placeholder="Select category"
															data={categoryOptions}
															searchable
															error={errors.categoryId?.message}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="status"
													control={control}
													render={({ field }) => (
														<Select
															{...field}
															label="Status"
															placeholder="Select status"
															data={[...STATUS_OPTIONS]}
															error={errors.status?.message}
														/>
													)}
												/>
											</Grid.Col>
										</Grid>

										{/* Description - full width */}
										<Textarea
											label="Description"
											placeholder="Enter product description"
											rows={4}
											{...register("description")}
											error={errors.description?.message}
										/>

										{/* Low-stock alert - inline sentence */}
										<div>
											<Text size="sm" fw={500} mb={4}>
												Low-stock alert
											</Text>
											<Group gap="xs" align="center" wrap="wrap">
												<Text size="sm">
													Flag for reorder when stock drops to
												</Text>
												<Controller
													name="lowStockAlert"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															w={90}
															min={0}
															hideControls
															value={value ?? ""}
															onChange={(val) =>
																onChange(
																	typeof val === "number" ? val : undefined,
																)
															}
															error={!!errors.lowStockAlert}
														/>
													)}
												/>
												<Text size="sm">units or fewer</Text>
											</Group>
											<Text size="xs" c="dimmed" mt={4}>
												Shows up in the Reorder list on the Stocks page.
											</Text>
										</div>
									</Stack>
								</Card.Section>
							</Card>

							{/* Variant & Finishes - starts with one variant */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Group justify="space-between" align="center">
										<Text fw={600}>Variant & Finishes</Text>
										<Button
											type="button"
											size="sm"
											variant="light"
											leftSection={<IconPlus size={14} />}
											onClick={() => appendVariant(createEmptyVariant())}
										>
											Add Variant
										</Button>
									</Group>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{variantFields.map((field, idx) => {
											const variantImages = variants?.[idx]?.images ?? [];
											// Varian lama (punya id): backend mengabaikan
											// initialStock → input stok di-disable.
											const isExistingVariant = Boolean(variants?.[idx]?.id);
											// Compare price = harga sebelum diskon; profit =
											// price - cost. Keduanya UI-only, tidak dikirim ke API.
											const variantPrice = variants?.[idx]?.price ?? 0;
											const variantDiscount =
												variants?.[idx]?.discountPercent ?? 0;
											const comparePrice =
												variantDiscount > 0 && variantDiscount < 100
													? Math.round(
															variantPrice / (1 - variantDiscount / 100),
														)
													: variantPrice;
											const variantCost =
												variants?.[idx]?.capitalPrice ?? 0;
											const profit = variantPrice - variantCost;
											// Persentase untung/rugi terhadap modal (cost). Tidak
											// ditampilkan saat cost 0 — pembaginya tidak bermakna.
											const profitPercent =
												variantCost > 0
													? Math.round((profit / variantCost) * 100)
													: null;
											return (
												<Paper key={field.id} p="md" radius="md" withBorder>
													<Stack gap="md">
														{/* Row 1: Color + SKU + Visibility */}
														<Grid gap="md">
															<Grid.Col span={{ base: 12, sm: 4 }}>
																<Controller
																	name={`variant.${idx}.colorId`}
																	control={control}
																	render={({ field }) => (
																		<Select
																			{...field}
																			value={field.value || null}
																			onChange={(val) =>
																				field.onChange(val ?? "")
																			}
																			label="Color / Finish"
																			placeholder="Select color"
																			data={colorOptions}
																			searchable
																			error={
																				errors.variant?.[idx]?.colorId?.message
																			}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 12, sm: 4 }}>
																<TextInput
																	label="SKU"
																	placeholder="Variant SKU"
																	{...register(`variant.${idx}.sku`)}
																	error={errors.variant?.[idx]?.sku?.message}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 12, sm: 4 }}>
																<Controller
																	name={`variant.${idx}.visibility`}
																	control={control}
																	render={({ field }) => (
																		<Select
																			{...field}
																			label="Visibility"
																			data={VISIBILITY_OPTIONS}
																		/>
																	)}
																/>
															</Grid.Col>
														</Grid>

														{/* Row 2: Price, Cost, Discount, Compare, Marketplace, Stock */}
														<Grid gap="md">
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variant.${idx}.price`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Price"
																			placeholder="0"
																			leftSection="Rp"
																			thousandSeparator="."
																			decimalSeparator=","
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																			error={
																				errors.variant?.[idx]?.price?.message
																			}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variant.${idx}.capitalPrice`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Cost"
																			placeholder="0"
																			leftSection="Rp"
																			thousandSeparator="."
																			decimalSeparator=","
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																			error={
																				errors.variant?.[idx]?.capitalPrice
																					?.message
																			}
																		/>
																	)}
																/>
																{/* Profit = price - cost, UI-only. */}
																<Text
																	size="xs"
																	c={profit < 0 ? "red" : "green"}
																	fw={700}
																	mt={4}
																>
																	Profit: {formatCurrency(profit)}
																	{profitPercent !== null &&
																		` (${profitPercent}%)`}
																</Text>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variant.${idx}.discountPercent`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Discount"
																			placeholder="0"
																			suffix="%"
																			hideControls
																			value={value || ""}
																			onChange={(val) =>
																				onChange(
																					typeof val === "number" ? val : 0,
																				)
																			}
																			error={
																				errors.variant?.[idx]?.discountPercent
																					?.message
																			}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																{/* UI-only: otomatis dihitung dari
																    price+discount, tidak dikirim ke API. */}
																<NumberInput
																	label="Compare Price"
																	placeholder="0"
																	leftSection="Rp"
																	thousandSeparator="."
																	decimalSeparator=","
																	hideControls
																	value={comparePrice || ""}
																	disabled
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variant.${idx}.marketplacePrice`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Marketplace"
																			placeholder="0"
																			leftSection="Rp"
																			thousandSeparator="."
																			decimalSeparator=","
																			hideControls
																			value={value || ""}
																			onChange={(val) =>
																				onChange(
																					typeof val === "number"
																						? val
																						: undefined,
																				)
																			}
																			error={
																				errors.variant?.[idx]?.marketplacePrice
																					?.message
																			}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variant.${idx}.initialStock`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Initial Stock"
																			placeholder="0"
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																			// Backend mengabaikan initialStock
																			// untuk varian lama.
																			disabled={isExistingVariant}
																			error={
																				errors.variant?.[idx]?.initialStock
																					?.message
																			}
																		/>
																	)}
																/>
															</Grid.Col>
														</Grid>

														{/* Row 3: Images picker + preview */}
														<div>
															<Text size="sm" fw={500} mb="xs">
																Images
															</Text>
															<Group gap="sm" align="flex-start" wrap="wrap">
																<Paper
																	radius="md"
																	onClick={() =>
																		setPickerTarget({ kind: "variant", index: idx })
																	}
																	style={{
																		border:
																			"2px dashed var(--mantine-color-gray-3)",
																		textAlign: "center",
																		cursor: "pointer",
																		width: 220,
																		height: 220,
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "center",
																	}}
																>
																	<Stack align="center" gap={4}>
																		<IconUpload size={20} color="gray" />
																		<Text size="xs" c="dimmed">
																			Select
																		</Text>
																	</Stack>
																</Paper>
																{variantImages.map((mediaId, imgIdx) => (
																	<div
																		key={mediaId}
																		style={{ position: "relative" }}
																	>
																		<Image
																			src={previewUrl(mediaId)}
																			w={220}
																			h={220}
																			radius="md"
																			fit="cover"
																			alt="Variant image"
																		/>
																		<Button
																			type="button"
																			size="compact-xs"
																			color="red"
																			variant="filled"
																			onClick={() =>
																				setValue(
																					`variant.${idx}.images`,
																					variantImages.filter(
																						(_, i) => i !== imgIdx,
																					),
																				)
																			}
																			style={{
																				position: "absolute",
																				top: 4,
																				right: 4,
																				padding: 0,
																				width: 20,
																				height: 20,
																			}}
																		>
																			<IconX size={12} />
																		</Button>
																	</div>
																))}
															</Group>
															{errors.variant?.[idx]?.images && (
																<Text size="xs" c="red" mt={4}>
																	{errors.variant[idx]?.images?.message}
																</Text>
															)}
														</div>

														{/* Remove variant (kept disabled when it is the last one) */}
														<Group justify="flex-end">
															<Button
																type="button"
																color="red"
																variant="subtle"
																size="xs"
																leftSection={<IconTrash size={14} />}
																disabled={variantFields.length === 1}
																onClick={() => removeVariant(idx)}
															>
																Remove Variant
															</Button>
														</Group>
													</Stack>
												</Paper>
											);
										})}
									</Stack>
									{errors.variant?.message && (
										<Text size="xs" c="red" mt={4}>
											{errors.variant.message}
										</Text>
									)}
								</Card.Section>
							</Card>
						</Stack>
					</Tabs.Panel>

					{/* TAB: MATERIALS & CARE */}
					<Tabs.Panel value="materials" pt="md">
						<Stack gap="md">
							{/* Material Information */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Material Information</Text>
										<Text size="sm" c="dimmed">
											Describe the materials used in this product.
										</Text>
									</div>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Textarea
										placeholder="Enter material information"
										rows={4}
										{...register("materialInformation")}
										error={errors.materialInformation?.message}
									/>
								</Card.Section>
							</Card>

							{/* Care Instructions — opsi dinamis dari GET /care-instructions */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Care Instructions</Text>
										<Text size="sm" c="dimmed">
											Select all care instructions that apply to this product.
											Care guidance will be shown on the product page.
										</Text>
									</div>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Controller
										name="careInstructionIds"
										control={control}
										render={({ field: { value, onChange } }) => (
											<Stack gap="xs">
												{careInstructionOptions.length === 0 && (
													<Text size="sm" c="dimmed">
														{careInstructionsQuery.isLoading
															? "Loading care instructions..."
															: "No care instructions available."}
													</Text>
												)}
												{careInstructionOptions.map((option) => (
													<Checkbox
														key={option.id}
														label={option.instruction}
														checked={value?.includes(option.id) || false}
														onChange={(e) => {
															if (e.currentTarget.checked) {
																onChange([...(value || []), option.id]);
															} else {
																onChange(
																	(value || []).filter((v) => v !== option.id),
																);
															}
														}}
													/>
												))}
												{errors.careInstructionIds && (
													<Text size="xs" c="red">
														{errors.careInstructionIds.message}
													</Text>
												)}
											</Stack>
										)}
									/>
								</Card.Section>
							</Card>
						</Stack>
					</Tabs.Panel>

					{/* TAB: DIMENSION - split into two columns */}
					<Tabs.Panel value="dimension" pt="md">
						<Grid gap="md">
							{/* Product Dimension */}
							<Grid.Col span={{ base: 12, md: 6 }}>
								<Card withBorder h="100%">
									<Card.Section inheritPadding py="md" pb="lg">
										<div>
											<Text fw={600}>Product Dimension</Text>
											<Text size="sm" c="dimmed" mih={72}>
												Upload your dimension diagram — typically a photo with
												width/depth/height labelled directly on the product.
												This is what appears on the storefront.
											</Text>
										</div>
									</Card.Section>
									<Card.Section inheritPadding pb="md">
										<Stack gap="md">
											{productDimensionImage ? (
												<div style={{ position: "relative" }}>
													{/* Rasio 1:1, lebar penuh mengikuti kolom card. */}
													<AspectRatio ratio={1}>
														<Image
															src={previewUrl(productDimensionImage)}
															radius="md"
															fit="cover"
															alt="Product dimension diagram"
															style={{ cursor: "pointer" }}
															onClick={() =>
																setPickerTarget({ kind: "productDimension" })
															}
														/>
													</AspectRatio>
													<Button
														type="button"
														size="compact-xs"
														color="red"
														variant="filled"
														onClick={() =>
															setValue("productDimension.image", "")
														}
														style={{
															position: "absolute",
															top: 6,
															right: 6,
															padding: 0,
															width: 24,
															height: 24,
														}}
													>
														<IconX size={14} />
													</Button>
												</div>
											) : (
												<Paper
													p="lg"
													radius="md"
													onClick={() =>
														setPickerTarget({ kind: "productDimension" })
													}
													style={{
														border: "2px dashed var(--mantine-color-gray-3)",
														textAlign: "center",
														cursor: "pointer",
														minHeight: "150px",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<Stack align="center">
														<IconUpload size={24} color="gray" />
														<Text size="sm" c="dimmed">
															Select dimension diagram
														</Text>
													</Stack>
												</Paper>
											)}
											{errors.productDimension?.image && (
												<Text size="xs" c="red">
													{errors.productDimension.image.message}
												</Text>
											)}
											{/* Width / Depth / Height / Weight - side by side */}
											<Grid gap="md">
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="productDimension.width"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Width (cm)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={
																	errors.productDimension?.width?.message
																}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="productDimension.depth"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Depth (cm)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={
																	errors.productDimension?.depth?.message
																}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="productDimension.height"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Height (cm)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={
																	errors.productDimension?.height?.message
																}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="productDimension.weight"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Weight (kg)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={
																	errors.productDimension?.weight?.message
																}
															/>
														)}
													/>
												</Grid.Col>
											</Grid>
										</Stack>
									</Card.Section>
								</Card>
							</Grid.Col>

							{/* Box Dimension */}
							<Grid.Col span={{ base: 12, md: 6 }}>
								<Card withBorder h="100%">
									<Card.Section inheritPadding py="md" pb="lg">
										<div>
											<Text fw={600}>Box Dimensions</Text>
											<Text size="sm" c="dimmed" mih={72}>
												Upload your shipping-box diagram. Used by shipping zones
												to calculate freight.
											</Text>
										</div>
									</Card.Section>
									<Card.Section inheritPadding pb="md">
										<Stack gap="md">
											{boxDimensionImage ? (
												<div style={{ position: "relative" }}>
													{/* Rasio 1:1, lebar penuh mengikuti kolom card. */}
													<AspectRatio ratio={1}>
														<Image
															src={previewUrl(boxDimensionImage)}
															radius="md"
															fit="cover"
															alt="Box dimension diagram"
															style={{ cursor: "pointer" }}
															onClick={() =>
																setPickerTarget({ kind: "boxDimension" })
															}
														/>
													</AspectRatio>
													<Button
														type="button"
														size="compact-xs"
														color="red"
														variant="filled"
														onClick={() => setValue("boxDimension.image", "")}
														style={{
															position: "absolute",
															top: 6,
															right: 6,
															padding: 0,
															width: 24,
															height: 24,
														}}
													>
														<IconX size={14} />
													</Button>
												</div>
											) : (
												<Paper
													p="lg"
													radius="md"
													onClick={() =>
														setPickerTarget({ kind: "boxDimension" })
													}
													style={{
														border: "2px dashed var(--mantine-color-gray-3)",
														textAlign: "center",
														cursor: "pointer",
														minHeight: "150px",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<Stack align="center">
														<IconUpload size={24} color="gray" />
														<Text size="sm" c="dimmed">
															Select box diagram
														</Text>
													</Stack>
												</Paper>
											)}
											{errors.boxDimension?.image && (
												<Text size="xs" c="red">
													{errors.boxDimension.image.message}
												</Text>
											)}
											{/* Box W / D / H / Weight - side by side */}
											<Grid gap="md">
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="boxDimension.width"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box W (cm)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={errors.boxDimension?.width?.message}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="boxDimension.depth"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box D (cm)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={errors.boxDimension?.depth?.message}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="boxDimension.height"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box H (cm)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={errors.boxDimension?.height?.message}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 12, sm: 4 }}>
													<Controller
														name="boxDimension.weight"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box Weight (kg)"
																placeholder="0"
																hideControls
																value={value ?? ""}
																onChange={onChange}
																error={errors.boxDimension?.weight?.message}
															/>
														)}
													/>
												</Grid.Col>
											</Grid>
										</Stack>
									</Card.Section>
								</Card>
							</Grid.Col>
						</Grid>
					</Tabs.Panel>

					{/* TAB: MEDIA */}
					<Tabs.Panel value="media" pt="md">
						<Stack gap="md">
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Media Overview</Text>
										<Text size="sm" c="dimmed">
											Select product images from the media library. These
											images will be displayed on the product detail page.
										</Text>
									</div>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										<Paper
											p="lg"
											radius="md"
											onClick={() => setPickerTarget({ kind: "media" })}
											style={{
												border: "2px dashed var(--mantine-color-gray-3)",
												textAlign: "center",
												cursor: "pointer",
												minHeight: "200px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<Stack align="center">
												<IconUpload size={32} color="gray" />
												<div>
													<Text size="sm" fw={500}>
														Click to select images from the media library
													</Text>
													<Text size="xs" c="dimmed">
														Upload new files from the Media page
													</Text>
												</div>
											</Stack>
										</Paper>

										{/* Preview of selected images */}
										{media && media.length > 0 ? (
											<Grid gap="md">
												{media.map((mediaId, imgIdx) => (
													<Grid.Col
														key={mediaId}
														span={{ base: 6, sm: 4, md: 3 }}
													>
														<div style={{ position: "relative" }}>
															<Image
																src={previewUrl(mediaId)}
																radius="md"
																fit="cover"
																h={160}
																alt="Product media"
															/>
															<Button
																type="button"
																size="compact-xs"
																color="red"
																variant="filled"
																onClick={() =>
																	setValue(
																		"media",
																		media.filter((_, i) => i !== imgIdx),
																	)
																}
																style={{
																	position: "absolute",
																	top: 6,
																	right: 6,
																	padding: 0,
																	width: 24,
																	height: 24,
																}}
															>
																<IconX size={14} />
															</Button>
														</div>
													</Grid.Col>
												))}
											</Grid>
										) : (
											<Text size="sm" c="dimmed">
												No images selected yet.
											</Text>
										)}
										{errors.media && (
											<Text size="xs" c="red">
												{errors.media.message}
											</Text>
										)}
									</Stack>
								</Card.Section>
							</Card>
						</Stack>
					</Tabs.Panel>
				</Tabs>

				{/* Previous / Next tab navigation */}
				<Group justify="space-between" mt="xl">
					<Button
						type="button"
						variant="default"
						leftSection={<IconChevronLeft size={16} />}
						disabled={currentTabIndex <= 0}
						onClick={goToPrevTab}
					>
						Previous
					</Button>
					<Button
						type="button"
						variant="default"
						rightSection={<IconChevronRight size={16} />}
						disabled={currentTabIndex >= TAB_ORDER.length - 1}
						onClick={goToNextTab}
					>
						Next
					</Button>
				</Group>
			</form>

			<MediaPickerModal
				opened={pickerTarget !== null}
				onClose={() => setPickerTarget(null)}
				onSelect={handlePickMedia}
			/>
		</Container>
	);
}
