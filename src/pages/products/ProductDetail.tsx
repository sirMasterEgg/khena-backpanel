import {
	Badge,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Loader,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { IconArrowLeft, IconPencil } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import { listColors } from "@/api/colors";
import { getMediaPreviewUrl } from "@/api/media";
import { getProduct } from "@/api/products";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ProductDetail() {
	const navigate = useNavigate();
	const { id } = useParams();
	usePageTitle("Product Detail");

	const {
		data: product,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["products", id],
		queryFn: () => getProduct(id as string),
		enabled: Boolean(id),
	});

	// Response varian hanya membawa colorId — nama warnanya diambil dari
	// GET /colors lalu dipetakan di render.
	const colorsQuery = useQuery({
		queryKey: ["colors", { forOptions: true }],
		queryFn: () => listColors({ limit: 100 }),
	});
	const colorNameById = new Map(
		(colorsQuery.data?.data ?? []).map((c) => [c.id, c.name]),
	);

	if (isLoading) {
		return (
			<Container size="xl">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	// Termasuk `400 product not found` (error.code NOT_FOUND).
	if (isError || !product) {
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
						{isError
							? getApiErrorMessage(error)
							: "The product you're looking for doesn't exist."}
					</Text>
				</Card>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<PageHeader
				title={product.name}
				actions={
					<Group gap="sm">
						<Button
							variant="default"
							leftSection={<IconArrowLeft size={16} />}
							onClick={() => navigate("/products")}
						>
							Back
						</Button>
						<Button
							leftSection={<IconPencil size={16} />}
							onClick={() => navigate(`/products/${product.id}/edit`)}
						>
							Edit
						</Button>
					</Group>
				}
			/>

			<Grid gap="md">
				{/* Main Content */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap="md">
						{/* Basic Info */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Product Information</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Grid gap="md">
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Product Name
											</Text>
											<Text fw={500}>{product.name}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												SKU
											</Text>
											<Text fw={500}>{product.baseSku}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Collection
											</Text>
											{/* Response detail tidak menyertakan collection. */}
											<Text fw={500}>—</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Category
											</Text>
											<Text fw={500}>{product.category.name}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Status
											</Text>
											{product.status ? (
												<StatusBadge status={product.status} />
											) : (
												<Text fw={500}>—</Text>
											)}
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Low Stock Alert
											</Text>
											<Text fw={500}>{product.lowStockAlert ?? "—"}</Text>
										</div>
									</Grid.Col>
									{product.description && (
										<Grid.Col span={12}>
											<div>
												<Text size="sm" c="dimmed">
													Description
												</Text>
												<Text fw={500}>{product.description}</Text>
											</div>
										</Grid.Col>
									)}
								</Grid>
							</Card.Section>
						</Card>

						{/* Pricing & Inventory — harga/stok level produk tidak ada di API
						    (harga per varian ada di tabel Variants). */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Pricing & Inventory</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Grid gap="md">
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Price
											</Text>
											<Text fw={500}>—</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Cost
											</Text>
											<Text fw={500}>—</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Margin
											</Text>
											<Text fw={500}>—</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Stock
											</Text>
											<Badge color="gray" variant="light">
												—
											</Badge>
										</div>
									</Grid.Col>
								</Grid>
							</Card.Section>
						</Card>

						{/* Variants */}
						{product.variants.length > 0 && (
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600}>Product Variants</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Table striped>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Color/Finish</Table.Th>
												<Table.Th>SKU</Table.Th>
												<Table.Th>Price</Table.Th>
												<Table.Th>Stock</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{product.variants.map((variant) => (
												<Table.Tr key={variant.id}>
													<Table.Td>
														{colorNameById.get(variant.colorId) ?? "—"}
													</Table.Td>
													<Table.Td>{variant.detailProductSku}</Table.Td>
													<Table.Td>${variant.price}</Table.Td>
													<Table.Td>
														{/* Stok varian tidak ada di response detail. */}
														<Badge color="gray" variant="light">
															—
														</Badge>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								</Card.Section>
							</Card>
						)}

						{/* Materials & Care */}
						{(product.materials || product.careInstructions.length > 0) && (
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600}>Materials & Care</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{product.materials && (
											<div>
												<Text size="sm" c="dimmed" mb="xs">
													Material Information
												</Text>
												<Text fw={500}>{product.materials}</Text>
											</div>
										)}
										{product.careInstructions.length > 0 && (
											<div>
												<Text size="sm" c="dimmed" mb="xs">
													Care Instructions
												</Text>
												<Group gap="xs">
													{product.careInstructions.map((care) => (
														<Badge key={care.id} variant="light">
															{care.instruction}
														</Badge>
													))}
												</Group>
											</div>
										)}
									</Stack>
								</Card.Section>
							</Card>
						)}

						{/* Dimensions */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Dimensions</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Stack gap="md">
									<div>
										<Text size="sm" fw={500} mb="xs">
											Product Dimension
										</Text>
										<Grid gap="md">
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Width
												</Text>
												<Text fw={500}>{product.productDimension.width} cm</Text>
											</Grid.Col>
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Depth
												</Text>
												<Text fw={500}>{product.productDimension.depth} cm</Text>
											</Grid.Col>
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Height
												</Text>
												<Text fw={500}>
													{product.productDimension.height} cm
												</Text>
											</Grid.Col>
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Weight
												</Text>
												<Text fw={500}>
													{product.productDimension.weight} kg
												</Text>
											</Grid.Col>
										</Grid>
									</div>
									<div>
										<Text size="sm" fw={500} mb="xs">
											Box Dimension
										</Text>
										<Grid gap="md">
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Box Width
												</Text>
												<Text fw={500}>{product.boxDimension.width} cm</Text>
											</Grid.Col>
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Box Depth
												</Text>
												<Text fw={500}>{product.boxDimension.depth} cm</Text>
											</Grid.Col>
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Box Height
												</Text>
												<Text fw={500}>{product.boxDimension.height} cm</Text>
											</Grid.Col>
											<Grid.Col span={{ base: 6, sm: 3 }}>
												<Text size="xs" c="dimmed">
													Box Weight
												</Text>
												<Text fw={500}>{product.boxDimension.weight} kg</Text>
											</Grid.Col>
										</Grid>
									</div>
								</Stack>
							</Card.Section>
						</Card>
					</Stack>
				</Grid.Col>

				{/* Sidebar */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap="md">
						{/* Media Gallery */}
						{product.media.length > 0 && (
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600} size="sm">
										Media
									</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{product.media.map((file) => (
											<img
												key={file.id}
												src={getMediaPreviewUrl(file)}
												alt={file.altText ?? file.name}
												style={{ width: "100%", borderRadius: "8px" }}
											/>
										))}
									</Stack>
								</Card.Section>
							</Card>
						)}
					</Stack>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
