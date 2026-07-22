import {
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Image,
	Loader,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { IconArrowLeft, IconPencil } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import { getCollection } from "@/api/collections";
import { getMediaPreviewUrl } from "@/api/media";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";

const COVER_PLACEHOLDER = "https://placehold.co/600x400?text=No+Image";
const HERO_PLACEHOLDER = "https://placehold.co/1200x400?text=No+Image";

export function CollectionDetail() {
	const navigate = useNavigate();
	const { id } = useParams();

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["collections", id],
		queryFn: () => getCollection(id as string),
	});

	usePageTitle(data ? data.name : "Collection");

	if (isLoading) {
		return (
			<Container size="xl">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	// Termasuk `400 collection not found`.
	if (isError || !data) {
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
						{getApiErrorMessage(error)}
					</Text>
				</Card>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<PageHeader
				title={data.name}
				subtitle="Collection details"
				actions={
					<Group gap="sm">
						<Button
							variant="default"
							leftSection={<IconArrowLeft size={16} />}
							onClick={() => navigate("/collections")}
						>
							Back
						</Button>
						<Button
							leftSection={<IconPencil size={16} />}
							onClick={() => navigate(`/collections/${id}/edit`)}
						>
							Edit
						</Button>
					</Group>
				}
			/>

			<Grid gap="lg">
				{/* KOLOM KIRI: info + daftar produk */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Card withBorder mb="lg">
						<Stack gap="sm">
							<Group justify="space-between">
								<Text fw={600}>Collection Information</Text>
								<StatusBadge status={data.status} />
							</Group>
							<Group gap="xl">
								<div>
									<Text size="xs" c="dimmed">
										Slug
									</Text>
									<Text size="sm">{data.slug}</Text>
								</div>
								<div>
									<Text size="xs" c="dimmed">
										Total Products
									</Text>
									<Text size="sm">{data.totalProducts}</Text>
								</div>
							</Group>
						</Stack>
					</Card>

					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Products in Collection</Text>
							<Table striped>
								<Table.Thead>
									<Table.Tr>
										<Table.Th style={{ width: 50 }}>No</Table.Th>
										<Table.Th>Name</Table.Th>
										<Table.Th>SKU</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{data.products.length > 0 ? (
										data.products.map((product, index) => (
											<Table.Tr key={product.id}>
												<Table.Td>{index + 1}</Table.Td>
												<Table.Td>{product.name}</Table.Td>
												<Table.Td>{product.sku}</Table.Td>
											</Table.Tr>
										))
									) : (
										<Table.Tr>
											<Table.Td
												colSpan={3}
												style={{ textAlign: "center", padding: "2rem" }}
											>
												No products in this collection
											</Table.Td>
										</Table.Tr>
									)}
								</Table.Tbody>
							</Table>
						</Stack>
					</Card>
				</Grid.Col>

				{/* KOLOM KANAN: cover + banner */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Card withBorder mb="lg">
						<Stack gap="md">
							<Text fw={600}>Cover Image</Text>
							<Image
								src={
									data.coverImage
										? getMediaPreviewUrl(data.coverImage)
										: COVER_PLACEHOLDER
								}
								alt="Cover"
								radius="md"
							/>
						</Stack>
					</Card>
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Product Showcase Hero</Text>
							<Image
								src={
									data.bannerImage
										? getMediaPreviewUrl(data.bannerImage)
										: HERO_PLACEHOLDER
								}
								alt="Hero banner"
								radius="md"
							/>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
