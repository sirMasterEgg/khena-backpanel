import {
	Badge,
	Button,
	Card,
	Container,
	Grid,
	Group,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { IconArrowLeft, IconPencil } from "@tabler/icons-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { dummyProducts } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ProductDetail() {
	const navigate = useNavigate();
	const { id } = useParams();
	usePageTitle("Product Detail");

	const product = useMemo(() => {
		return dummyProducts.find((p) => p.id === Number(id));
	}, [id]);

	if (!product) {
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
						The product you're looking for doesn't exist.
					</Text>
				</Card>
			</Container>
		);
	}

	const calculateMargin = (price: number, cost: number) => {
		return Math.round(((price - cost) / price) * 100);
	};

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
											<Text fw={500}>{product.sku}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Collection
											</Text>
											<Text fw={500}>{product.collection}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Category
											</Text>
											<Text fw={500}>{product.category}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Status
											</Text>
											<StatusBadge
												status={
													product.status as
														| "published"
														| "draft"
														| "scheduled"
														| "archived"
												}
											/>
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

						{/* Pricing & Inventory */}
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
											<Text fw={500}>${product.price}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Cost
											</Text>
											<Text fw={500}>${product.cost}</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Margin
											</Text>
											<Text fw={500}>{calculateMargin(product.price, product.cost)}%</Text>
										</div>
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<div>
											<Text size="sm" c="dimmed">
												Stock
											</Text>
											<Badge
												color={
													product.stock === 0
														? "red"
														: product.stock < 5
															? "yellow"
															: "green"
												}
											>
												{product.stock} units
											</Badge>
										</div>
									</Grid.Col>
								</Grid>
							</Card.Section>
						</Card>

						{/* Variants */}
						{product.variants && product.variants.length > 0 && (
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
													<Table.Td>{variant.colorFinish}</Table.Td>
													<Table.Td>{variant.sku}</Table.Td>
													<Table.Td>${variant.price}</Table.Td>
													<Table.Td>
														<Badge
															color={
																variant.stock === 0
																	? "red"
																	: variant.stock < 3
																		? "yellow"
																		: "green"
															}
														>
															{variant.stock}
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
						{(product.materialInfo || product.careCategories) && (
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600}>Materials & Care</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{product.materialInfo && (
											<div>
												<Text size="sm" c="dimmed" mb="xs">
													Material Information
												</Text>
												<Text fw={500}>{product.materialInfo}</Text>
											</div>
										)}
										{product.careCategories && product.careCategories.length > 0 && (
											<div>
												<Text size="sm" c="dimmed" mb="xs">
													Care Categories
												</Text>
												<Group gap="xs">
													{product.careCategories.map((cat) => (
														<Badge key={cat} variant="light">
															{cat}
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
						{(product.dimension || product.boxDimension) && (
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600}>Dimensions</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{product.dimension && (
											<div>
												<Text size="sm" fw={500} mb="xs">
													Product Dimension
												</Text>
												<Grid gap="md">
													{product.dimension.width && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Width
															</Text>
															<Text fw={500}>{product.dimension.width} cm</Text>
														</Grid.Col>
													)}
													{product.dimension.depth && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Depth
															</Text>
															<Text fw={500}>{product.dimension.depth} cm</Text>
														</Grid.Col>
													)}
													{product.dimension.height && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Height
															</Text>
															<Text fw={500}>{product.dimension.height} cm</Text>
														</Grid.Col>
													)}
													{product.dimension.weight && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Weight
															</Text>
															<Text fw={500}>{product.dimension.weight} kg</Text>
														</Grid.Col>
													)}
												</Grid>
											</div>
										)}
										{product.boxDimension && (
											<div>
												<Text size="sm" fw={500} mb="xs">
													Box Dimension
												</Text>
												<Grid gap="md">
													{product.boxDimension.width && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Box Width
															</Text>
															<Text fw={500}>{product.boxDimension.width} cm</Text>
														</Grid.Col>
													)}
													{product.boxDimension.depth && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Box Depth
															</Text>
															<Text fw={500}>{product.boxDimension.depth} cm</Text>
														</Grid.Col>
													)}
													{product.boxDimension.height && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Box Height
															</Text>
															<Text fw={500}>{product.boxDimension.height} cm</Text>
														</Grid.Col>
													)}
													{product.boxDimension.weight && (
														<Grid.Col span={{ base: 6, sm: 3 }}>
															<Text size="xs" c="dimmed">
																Box Weight
															</Text>
															<Text fw={500}>{product.boxDimension.weight} kg</Text>
														</Grid.Col>
													)}
												</Grid>
											</div>
										)}
									</Stack>
								</Card.Section>
							</Card>
						)}
					</Stack>
				</Grid.Col>

				{/* Sidebar */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap="md">
						{/* Media Gallery */}
						{product.media && product.media.length > 0 && (
							<Card withBorder>
								<Card.Section inheritPadding py="md" pb="lg">
									<Text fw={600} size="sm">
										Media
									</Text>
								</Card.Section>
								<Card.Section inheritPadding pb="md">
									<Stack gap="md">
										{product.media.map((url, idx) => (
											<img
												key={idx}
												src={url}
												alt={`Media ${idx + 1}`}
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
