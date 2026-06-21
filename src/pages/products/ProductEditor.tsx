import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Card,
	Checkbox,
	Container,
	Grid,
	Group,
	Image,
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
	IconChevronLeft,
	IconChevronRight,
	IconPlus,
	IconTrash,
	IconUpload,
	IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import {
	CARE_CATEGORY_OPTIONS,
	STATUS_OPTIONS,
	VISIBILITY_OPTIONS,
} from "@/config/productOptions";
import {
	dummyCategories,
	dummyCollections,
	dummyColors,
	dummyProducts,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { productSchema } from "./productSchema";

// Order of the editor tabs, used by the Previous/Next footer navigation.
const TAB_ORDER = ["general", "materials", "dimension", "media"];

// Always give variants a unique data id. useFieldArray uses its own internal
// key, so this only needs to be unique enough to be a stable number value.
const createEmptyVariant = () => ({
	id: Date.now() + Math.floor(Math.random() * 1000),
	colorFinish: "",
	sku: "",
	visibility: "visible" as const,
	price: 0,
	cost: 0,
	discount: 0,
	comparePrice: 0,
	marketplacePrice: 0,
	stock: 0,
	images: [] as string[],
});

export function ProductEditor() {
	usePageTitle("Product");
	const navigate = useNavigate();
	const { id } = useParams();
	const isNew = !id;

	const product = isNew ? null : dummyProducts.find((p) => p.id === Number(id));

	const [activeTab, setActiveTab] = useState<string | null>("general");
	const currentTabIndex = TAB_ORDER.indexOf(activeTab ?? "general");
	const goToPrevTab = () => setActiveTab(TAB_ORDER[currentTabIndex - 1]);
	const goToNextTab = () => setActiveTab(TAB_ORDER[currentTabIndex + 1]);

	const {
		control,
		handleSubmit,
		register,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(productSchema) as any,
		defaultValues: product
			? {
					name: product.name,
					sku: product.sku,
					collection: product.collection,
					category: product.category,
					status: product.status,
					description: product.description || "",
					lowStockAlert: product.lowStockAlert,
					// Ensure there is always at least one variant to fill in.
					variants:
						product.variants && product.variants.length > 0
							? product.variants.map((v) => ({ ...v }))
							: [createEmptyVariant()],
					materialInfo: product.materialInfo || "",
					careCategories: product.careCategories || [],
					dimension: product.dimension,
					boxDimension: product.boxDimension,
					media: product.media || [],
				}
			: {
					name: "",
					sku: "",
					collection: "",
					category: "",
					status: "draft" as const,
					description: "",
					lowStockAlert: 5,
					// Start with one empty variant so the user can fill it in
					// without having to click "Add Variant" first.
					variants: [createEmptyVariant()],
					materialInfo: "",
					careCategories: [],
					dimension: undefined,
					boxDimension: undefined,
					media: [],
				},
	});

	const {
		fields: variantFields,
		append: appendVariant,
		remove: removeVariant,
	} = useFieldArray({
		control,
		name: "variants",
	});

	// Watch variant fields to calculate compare price.
	const variants = watch("variants");
	useEffect(() => {
		variants?.forEach((variant, idx) => {
			if (variant.price !== undefined && variant.discount !== undefined) {
				const comparePrice =
					variant.discount > 0
						? Math.round(variant.price / (1 - variant.discount / 100))
						: variant.price;
				setValue(`variants.${idx}.comparePrice`, comparePrice);
			}
		});
	}, [variants, setValue]);

	const media = watch("media") as string[] | undefined;

	const onSubmit = (data: any) => {
		console.log("Form submitted:", data);
	};

	const collectionOptions = dummyCollections.map((c) => ({
		value: c.name,
		label: c.name,
	}));
	const categoryOptions = dummyCategories.map((c) => ({
		value: c.name,
		label: c.name,
	}));
	const colorOptions = dummyColors.map((c) => ({
		value: c.name,
		label: c.name,
	}));

	return (
		<Container size="xl">
			<PageHeader
				title={isNew ? "Add Product" : `Edit Product #${id}`}
				actions={
					<Group>
						<Button variant="light" onClick={() => navigate("/products")}>
							Cancel
						</Button>
						<Button onClick={handleSubmit(onSubmit)}>Save</Button>
					</Group>
				}
			/>

			<form onSubmit={handleSubmit(onSubmit)}>
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
											{...register("name")}
											error={errors.name?.message}
										/>

										{/* SKU + Collection - side by side */}
										<Grid gap="md">
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<TextInput
													label="SKU"
													placeholder="Enter SKU"
													{...register("sku")}
													error={errors.sku?.message}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="collection"
													control={control}
													render={({ field }) => (
														<Select
															{...field}
															label="Collection"
															placeholder="Select collection"
															data={collectionOptions}
															searchable
															error={errors.collection?.message}
														/>
													)}
												/>
											</Grid.Col>
										</Grid>

										{/* Category + Status - side by side */}
										<Grid gap="md">
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="category"
													control={control}
													render={({ field }) => (
														<Select
															{...field}
															label="Category"
															placeholder="Select category"
															data={categoryOptions}
															searchable
															error={errors.category?.message}
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
															onChange={onChange}
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
											return (
												<Paper key={field.id} p="md" radius="md" withBorder>
													<Stack gap="md">
														{/* Row 1: Color/Finish + SKU + Visibility */}
														<Grid gap="md">
															<Grid.Col span={{ base: 12, sm: 4 }}>
																<Controller
																	name={`variants.${idx}.colorFinish`}
																	control={control}
																	render={({ field }) => (
																		<Select
																			{...field}
																			label="Color / Finish"
																			placeholder="Select color"
																			data={colorOptions}
																			searchable
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 12, sm: 4 }}>
																<TextInput
																	label="SKU"
																	placeholder="Variant SKU"
																	{...register(`variants.${idx}.sku`)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 12, sm: 4 }}>
																<Controller
																	name={`variants.${idx}.visibility`}
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
																	name={`variants.${idx}.price`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Price"
																			placeholder="0.00"
																			prefix="$"
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variants.${idx}.cost`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Cost"
																			placeholder="0.00"
																			prefix="$"
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variants.${idx}.discount`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Discount"
																			placeholder="0"
																			suffix="%"
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variants.${idx}.comparePrice`}
																	control={control}
																	render={({ field: { value } }) => (
																		<NumberInput
																			label="Compare Price"
																			placeholder="0.00"
																			prefix="$"
																			hideControls
																			value={value || ""}
																			disabled
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variants.${idx}.marketplacePrice`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label="Marketplace"
																			placeholder="0.00"
																			prefix="$"
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																		/>
																	)}
																/>
															</Grid.Col>
															<Grid.Col span={{ base: 6, sm: 2 }}>
																<Controller
																	name={`variants.${idx}.stock`}
																	control={control}
																	render={({ field: { onChange, value } }) => (
																		<NumberInput
																			label={
																				isNew
																					? "Initial Stock"
																					: "Current Stock"
																			}
																			placeholder="0"
																			hideControls
																			value={value || ""}
																			onChange={onChange}
																		/>
																	)}
																/>
															</Grid.Col>
														</Grid>

														{/* Row 3: Images upload + preview */}
														<div>
															<Text size="sm" fw={500} mb="xs">
																Images
															</Text>
															<Group gap="sm" align="flex-start" wrap="wrap">
																<Paper
																	radius="md"
																	style={{
																		border:
																			"2px dashed var(--mantine-color-gray-3)",
																		textAlign: "center",
																		cursor: "pointer",
																		width: 110,
																		height: 110,
																		display: "flex",
																		alignItems: "center",
																		justifyContent: "center",
																	}}
																>
																	<Stack align="center" gap={4}>
																		<IconUpload size={20} color="gray" />
																		<Text size="xs" c="dimmed">
																			Upload
																		</Text>
																	</Stack>
																</Paper>
																{variantImages.map((url, imgIdx) => (
																	<div
																		key={url}
																		style={{ position: "relative" }}
																	>
																		<Image
																			src={url}
																			w={110}
																			h={110}
																			radius="md"
																			fit="cover"
																			alt="Variant image"
																		/>
																		<Button
																			size="compact-xs"
																			color="red"
																			variant="filled"
																			onClick={() =>
																				setValue(
																					`variants.${idx}.images`,
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
														</div>

														{/* Remove variant (kept disabled when it is the last one) */}
														<Group justify="flex-end">
															<Button
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
										{...register("materialInfo")}
										error={errors.materialInfo?.message}
									/>
								</Card.Section>
							</Card>

							{/* Care Instructions */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Care Instructions</Text>
										<Text size="sm" c="dimmed">
											Select all material categories that apply to this product.
											Care guidance will be shown on the product page.
										</Text>
									</div>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Controller
										name="careCategories"
										control={control}
										render={({ field: { value, onChange } }) => (
											<Stack gap="xs">
												{CARE_CATEGORY_OPTIONS.map((option) => (
													<Checkbox
														key={option.value}
														label={option.label}
														checked={
															(value as any)?.includes(option.value) || false
														}
														onChange={(e) => {
															if (e.currentTarget.checked) {
																onChange([...(value || []), option.value]);
															} else {
																onChange(
																	(value || []).filter(
																		(v) => v !== option.value,
																	),
																);
															}
														}}
													/>
												))}
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
											<Text size="sm" c="dimmed">
												Upload your dimension diagram — typically a photo with
												width/depth/height labelled directly on the product.
												This is what appears on the storefront.
											</Text>
										</div>
									</Card.Section>
									<Card.Section inheritPadding pb="md">
										<Stack gap="md">
											<Paper
												p="lg"
												radius="md"
												style={{
													border: "2px dashed var(--mantine-color-gray-3)",
													textAlign: "center",
													minHeight: "150px",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Stack align="center">
													<IconUpload size={24} color="gray" />
													<Text size="sm" c="dimmed">
														Upload dimension diagram
													</Text>
												</Stack>
											</Paper>
											{/* Width / Depth / Height / Weight - side by side */}
											<Grid gap="md">
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="dimension.width"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Width (cm)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="dimension.depth"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Depth (cm)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="dimension.height"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Height (cm)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="dimension.weight"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Weight (kg)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
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
											<Text size="sm" c="dimmed">
												Upload your shipping-box diagram. Used by shipping zones
												to calculate freight.
											</Text>
										</div>
									</Card.Section>
									<Card.Section inheritPadding pb="md">
										<Stack gap="md">
											<Paper
												p="lg"
												radius="md"
												style={{
													border: "2px dashed var(--mantine-color-gray-3)",
													textAlign: "center",
													minHeight: "150px",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<Stack align="center">
													<IconUpload size={24} color="gray" />
													<Text size="sm" c="dimmed">
														Upload box diagram
													</Text>
												</Stack>
											</Paper>
											{/* Box W / D / H / Weight - side by side */}
											<Grid gap="md">
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="boxDimension.width"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box W (cm)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="boxDimension.depth"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box D (cm)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="boxDimension.height"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box H (cm)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
															/>
														)}
													/>
												</Grid.Col>
												<Grid.Col span={{ base: 6, sm: 3 }}>
													<Controller
														name="boxDimension.weight"
														control={control}
														render={({ field: { onChange, value } }) => (
															<NumberInput
																label="Box Weight (kg)"
																placeholder="0"
																hideControls
																value={value || ""}
																onChange={onChange}
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
											Upload and manage product images. These images will be
											displayed on the product detail page.
										</Text>
									</div>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										<Paper
											p="lg"
											radius="md"
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
														Click or drag image to upload
													</Text>
													<Text size="xs" c="dimmed">
														PNG, JPG up to 5MB
													</Text>
												</div>
											</Stack>
										</Paper>

										{/* Preview of uploaded images */}
										{media && media.length > 0 ? (
											<Grid gap="md">
												{media.map((url, imgIdx) => (
													<Grid.Col key={url} span={{ base: 6, sm: 4, md: 3 }}>
														<div style={{ position: "relative" }}>
															<Image
																src={url}
																radius="md"
																fit="cover"
																h={160}
																alt="Product media"
															/>
															<Button
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
												No images uploaded yet.
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
						variant="default"
						leftSection={<IconChevronLeft size={16} />}
						disabled={currentTabIndex <= 0}
						onClick={goToPrevTab}
					>
						Previous
					</Button>
					<Button
						variant="default"
						rightSection={<IconChevronRight size={16} />}
						disabled={currentTabIndex >= TAB_ORDER.length - 1}
						onClick={goToNextTab}
					>
						Next
					</Button>
				</Group>
			</form>
		</Container>
	);
}
