import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Card,
	Checkbox,
	Container,
	Grid,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	Tabs,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import {
	CARE_CATEGORY_OPTIONS,
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

export function ProductEditor() {
	usePageTitle("Product");
	const navigate = useNavigate();
	const { id } = useParams();
	const isNew = !id;

	const product = isNew ? null : dummyProducts.find((p) => p.id === Number(id));

	const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm({
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
					variants: product.variants?.map((v) => ({ ...v, id: v.id })) || [],
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
					variants: [],
					materialInfo: "",
					careCategories: [],
					dimension: undefined,
					boxDimension: undefined,
					media: [],
				},
	});

	const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
		control,
		name: "variants",
	});

	// Watch variant fields to calculate compare price
	const variants = watch("variants");
	useEffect(() => {
		variants?.forEach((variant, idx) => {
			if (variant.price !== undefined && variant.discount !== undefined) {
				const comparePrice =
					variant.discount > 0 ? Math.round(variant.price / (1 - variant.discount / 100)) : variant.price;
				setValue(`variants.${idx}.comparePrice`, comparePrice);
			}
		});
	}, [variants, setValue]);

	const onSubmit = (data: any) => {
		console.log("Form submitted:", data);
	};

	const collectionOptions = dummyCollections.map((c) => ({ value: c.name, label: c.name }));
	const categoryOptions = dummyCategories.map((c) => ({ value: c.name, label: c.name }));
	const colorOptions = dummyColors.map((c) => ({ value: c.name, label: c.name }));

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
				<Tabs defaultValue="general">
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
										<TextInput
											label="Product Name"
											placeholder="Enter product name"
											{...register("name")}
											error={errors.name?.message}
										/>
										<TextInput
											label="SKU"
											placeholder="Enter SKU"
											{...register("sku")}
											error={errors.sku?.message}
										/>
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
										<Controller
											name="status"
											control={control}
											render={({ field }) => (
												<Select
													{...field}
													label="Status"
													placeholder="Select status"
													data={["published", "draft", "scheduled", "archived"]}
													error={errors.status?.message}
												/>
											)}
										/>
										<Textarea
											label="Description"
											placeholder="Enter product description"
											rows={4}
											{...register("description")}
											error={errors.description?.message}
										/>
										<Controller
											name="lowStockAlert"
											control={control}
											render={({ field: { onChange, value } }) => (
												<NumberInput
													label="Low Stock Alert"
													placeholder="5"
													value={value || ""}
													onChange={onChange}
													error={errors.lowStockAlert?.message}
												/>
											)}
										/>
									</Stack>
								</Card.Section>
							</Card>

							{/* Product Variants */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Group justify="space-between" align="center">
										<Text fw={600}>Product Variant</Text>
										<Button
											size="sm"
											variant="light"
											leftSection={<IconPlus size={14} />}
											onClick={() => {
												const newId = Math.max(0, ...variantFields.map((v) => v.id)) + 1;
												appendVariant({
													id: newId,
													colorFinish: "",
													sku: "",
													visibility: "visible",
													price: 0,
													cost: 0,
													discount: 0,
													comparePrice: 0,
													marketplacePrice: 0,
													stock: 0,
													images: [],
												});
											}}
										>
											Add Variant
										</Button>
									</Group>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{variantFields.length === 0 ? (
											<Text c="dimmed" size="sm" ta="center" py="md">
												No variants yet. Click "Add Variant" to create one.
											</Text>
										) : (
											variantFields.map((field, idx) => (
												<Paper key={field.id} p="md" radius="md" withBorder>
													<Grid gap="md">
														<Grid.Col span={{ base: 12, sm: 6 }}>
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
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<TextInput
																label="SKU"
																placeholder="Variant SKU"
																{...register(`variants.${idx}.sku`)}
															/>
														</Grid.Col>
														<Grid.Col span={{ base: 12, sm: 6 }}>
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
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<Controller
																name={`variants.${idx}.price`}
																control={control}
																render={({ field: { onChange, value } }) => (
																	<NumberInput
																		label="Price"
																		placeholder="0.00"
																		prefix="$"
																		value={value || ""}
																		onChange={onChange}
																	/>
																)}
															/>
														</Grid.Col>
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<Controller
																name={`variants.${idx}.cost`}
																control={control}
																render={({ field: { onChange, value } }) => (
																	<NumberInput
																		label="Cost"
																		placeholder="0.00"
																		prefix="$"
																		value={value || ""}
																		onChange={onChange}
																	/>
																)}
															/>
														</Grid.Col>
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<Controller
																name={`variants.${idx}.discount`}
																control={control}
																render={({ field: { onChange, value } }) => (
																	<NumberInput
																		label="Discount"
																		placeholder="0"
																		suffix="%"
																		value={value || ""}
																		onChange={onChange}
																	/>
																)}
															/>
														</Grid.Col>
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<Controller
																name={`variants.${idx}.comparePrice`}
																control={control}
																render={({ field: { value } }) => (
																	<NumberInput
																		label="Compare Price (auto)"
																		placeholder="0.00"
																		prefix="$"
																		value={value || ""}
																		disabled
																	/>
																)}
															/>
														</Grid.Col>
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<Controller
																name={`variants.${idx}.marketplacePrice`}
																control={control}
																render={({ field: { onChange, value } }) => (
																	<NumberInput
																		label="Marketplace Price"
																		placeholder="0.00"
																		prefix="$"
																		value={value || ""}
																		onChange={onChange}
																	/>
																)}
															/>
														</Grid.Col>
														<Grid.Col span={{ base: 12, sm: 6 }}>
															<Controller
																name={`variants.${idx}.stock`}
																control={control}
																render={({ field: { onChange, value } }) => (
																	<NumberInput
																		label={isNew ? "Initial Stock" : "Current Stock"}
																		placeholder="0"
																		value={value || ""}
																		onChange={onChange}
																	/>
																)}
															/>
														</Grid.Col>
														<Grid.Col span={12}>
															<Text size="sm" c="dimmed" mb="xs">
																Images
															</Text>
															<Paper
																p="lg"
																radius="md"
																style={{
																	border: "2px dashed var(--mantine-color-gray-3)",
																	textAlign: "center",
																	minHeight: "120px",
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																}}
															>
																<Stack align="center">
																	<IconUpload size={24} color="gray" />
																	<Text size="sm" c="dimmed">
																		Upload variant images
																	</Text>
																</Stack>
															</Paper>
														</Grid.Col>
														<Grid.Col span={12}>
															<Button
																color="red"
																variant="light"
																size="sm"
																leftSection={<IconTrash size={14} />}
																onClick={() => removeVariant(idx)}
																fullWidth
															>
																Remove Variant
															</Button>
														</Grid.Col>
													</Grid>
												</Paper>
											))
										)}
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
											Select all material categories that apply to this product. Care guidance will be shown
											on the product page.
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
														checked={(value as any)?.includes(option.value) || false}
														onChange={(e) => {
															if (e.currentTarget.checked) {
																onChange([...(value || []), option.value]);
															} else {
																onChange((value || []).filter((v) => v !== option.value));
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

					{/* TAB: DIMENSION */}
					<Tabs.Panel value="dimension" pt="md">
						<Stack gap="md">
							{/* Product Dimension */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Product Dimension</Text>
										<Text size="sm" c="dimmed">
											Upload your dimension diagram — typically a photo with width/depth/height labelled
											directly on the product. This is what appears on the storefront.
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
										<Grid gap="md">
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="dimension.width"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Width (cm)"
															placeholder="0"
															value={value || ""}
															onChange={onChange}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="dimension.depth"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Depth (cm)"
															placeholder="0"
															value={value || ""}
															onChange={onChange}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="dimension.height"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Height (cm)"
															placeholder="0"
															value={value || ""}
															onChange={onChange}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="dimension.weight"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Weight (kg)"
															placeholder="0"
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

							{/* Box Dimension */}
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Box Dimensions</Text>
										<Text size="sm" c="dimmed">
											Upload your shipping-box diagram. Used by shipping zones to calculate freight.
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
										<Grid gap="md">
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="boxDimension.width"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Box Width (cm)"
															placeholder="0"
															value={value || ""}
															onChange={onChange}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="boxDimension.depth"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Box Depth (cm)"
															placeholder="0"
															value={value || ""}
															onChange={onChange}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="boxDimension.height"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Box Height (cm)"
															placeholder="0"
															value={value || ""}
															onChange={onChange}
														/>
													)}
												/>
											</Grid.Col>
											<Grid.Col span={{ base: 12, sm: 6 }}>
												<Controller
													name="boxDimension.weight"
													control={control}
													render={({ field: { onChange, value } }) => (
														<NumberInput
															label="Box Weight (kg)"
															placeholder="0"
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
						</Stack>
					</Tabs.Panel>

					{/* TAB: MEDIA */}
					<Tabs.Panel value="media" pt="md">
						<Stack gap="md">
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<div>
										<Text fw={600}>Media Overview</Text>
										<Text size="sm" c="dimmed">
											Upload and manage product images. These images will be displayed on the product detail
											page.
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
										<Text size="sm" c="dimmed">
											{(watch("media") as any)?.length || 0} image(s) uploaded
										</Text>
									</Stack>
								</Card.Section>
							</Card>
						</Stack>
					</Tabs.Panel>
				</Tabs>
			</form>
		</Container>
	);
}
