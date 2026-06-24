import {
	Button,
	Card,
	Container,
	Grid,
	Group,
	Image,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconSearch, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { dummyCollections, dummyProducts } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CollectionEditor() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEdit = Boolean(id);

	const existing = isEdit
		? dummyCollections.find((c) => c.id === Number(id))
		: undefined;

	usePageTitle(isEdit ? "Edit Collection" : "Add Collection");

	const [name, setName] = useState(existing?.name ?? "");
	const [slug, setSlug] = useState(existing?.slug ?? "");
	const [status, setStatus] = useState<string | null>(
		existing?.status ?? "draft",
	);
	const [productIds, setProductIds] = useState<number[]>(
		existing?.productIds ?? [],
	);
	const [productSearch, setProductSearch] = useState("");

	const suggestions =
		productSearch.trim().length > 0
			? dummyProducts.filter(
					(p) =>
						p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
						!productIds.includes(p.id),
				)
			: [];

	const addProduct = (productId: number) => {
		setProductIds((prev) => [...prev, productId]);
		setProductSearch("");
	};

	const removeProduct = (productId: number) => {
		setProductIds((prev) => prev.filter((pid) => pid !== productId));
	};

	const handleSave = () => {
		console.log("Save collection:", { id, name, slug, status, productIds });
		navigate("/collections");
	};

	return (
		<Container size="xl">
			<PageHeader
				title={isEdit ? "Edit Collection" : "Add Collection"}
				subtitle="Create a new collections and curate the products that define it."
				actions={
					<Group gap="sm">
						<Button variant="default" onClick={() => navigate("/collections")}>
							Cancel
						</Button>
						<Button onClick={handleSave}>Save</Button>
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
								value={name}
								onChange={(e) => setName(e.currentTarget.value)}
							/>
							<TextInput
								label="Slug"
								placeholder="collection-slug"
								value={slug}
								onChange={(e) => setSlug(e.currentTarget.value)}
							/>
							<Select
								label="Status"
								data={[
									{ value: "draft", label: "Draft" },
									{ value: "published", label: "Published" },
								]}
								value={status}
								onChange={setStatus}
							/>
						</Stack>
					</Card>

					{/* Group: Products in Collection */}
					<Card withBorder>
						<Stack gap="md">
							<div>
								<Text fw={600}>Products in Collection</Text>
								<Text size="sm" c="dimmed">
									Type to find a product, then click it to add. Drag the handle
									to reorder.
								</Text>
							</div>

							{/* Search input */}
							<div style={{ position: "relative" }}>
								<TextInput
									placeholder="Search products..."
									leftSection={<IconSearch size={16} />}
									value={productSearch}
									onChange={(e) => setProductSearch(e.currentTarget.value)}
								/>
								{/* Dropdown saran produk */}
								{suggestions.length > 0 && (
									<Card
										withBorder
										p="xs"
										style={{
											position: "absolute",
											zIndex: 10,
											width: "100%",
											marginTop: 4,
										}}
									>
										<Stack gap={4}>
											{suggestions.slice(0, 6).map((p) => (
												<Button
													key={p.id}
													variant="subtle"
													justify="flex-start"
													fullWidth
													onClick={() => addProduct(p.id)}
												>
													{p.name}
												</Button>
											))}
										</Stack>
									</Card>
								)}
							</div>

							{/* List produk yang sudah ditambahkan */}
							<Stack gap="xs">
								{productIds.length === 0 && (
									<Text size="sm" c="dimmed">
										No products added yet.
									</Text>
								)}
								{productIds.map((pid) => {
									const product = dummyProducts.find((p) => p.id === pid);
									if (!product) return null;
									return (
										<Group key={pid} justify="space-between" wrap="nowrap">
											<Group gap="sm" wrap="nowrap">
												<Text c="dimmed" style={{ cursor: "grab" }}>
													⠿
												</Text>
												<Text size="sm">{product.name}</Text>
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
							<Image
								src={
									existing?.coverImage ??
									"https://placehold.co/600x400?text=No+Image"
								}
								alt="Cover preview"
								radius="md"
							/>
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
							<Image
								src={
									existing?.heroImage ??
									"https://placehold.co/1200x400?text=No+Image"
								}
								alt="Hero preview"
								radius="md"
							/>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
