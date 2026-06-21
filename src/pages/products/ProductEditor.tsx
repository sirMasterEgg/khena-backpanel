import {
	Button,
	Card,
	Container,
	Grid,
	Group,
	NumberInput,
	Paper,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ProductEditor() {
	usePageTitle("Add Product");
	const navigate = useNavigate();
	const { id } = useParams();
	const isNew = !id;

	return (
		<Container size="xl">
			<PageHeader
				title={isNew ? "Add Product" : `Edit Product #${id}`}
				actions={
					<Group>
						<Button variant="light" onClick={() => navigate("/products")}>
							Cancel
						</Button>
						<Button>Save</Button>
					</Group>
				}
			/>

			<Grid gap="md">
				{/* Left column - Main content */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap="md">
						{/* Basics */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Basics</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Stack gap="md">
									<TextInput
										label="Product Name"
										placeholder="Enter product name"
									/>
									<Textarea
										label="Description"
										placeholder="Enter product description"
										rows={4}
									/>
									<TextInput label="SKU" placeholder="Enter SKU" />
								</Stack>
							</Card.Section>
						</Card>

						{/* Media */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Media</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
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
							</Card.Section>
						</Card>

						{/* Pricing */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Pricing</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Grid gap="md">
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<NumberInput label="Price" placeholder="0.00" prefix="$" />
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<NumberInput label="Cost" placeholder="0.00" prefix="$" />
									</Grid.Col>
								</Grid>
							</Card.Section>
						</Card>

						{/* Inventory */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600}>Inventory</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Grid gap="md">
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<NumberInput label="Stock" placeholder="0" />
									</Grid.Col>
									<Grid.Col span={{ base: 12, sm: 6 }}>
										<NumberInput label="Reorder Point" placeholder="5" />
									</Grid.Col>
								</Grid>
							</Card.Section>
						</Card>
					</Stack>
				</Grid.Col>

				{/* Right column - Sidebar */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap="md">
						{/* Status */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600} size="sm">
									Status
								</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Select
									data={["Published", "Draft", "Scheduled", "Archived"]}
									defaultValue="Draft"
								/>
							</Card.Section>
						</Card>

						{/* Organization */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600} size="sm">
									Organization
								</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<Stack gap="md">
									<Select
										label="Category"
										placeholder="Select category"
										data={["Seating", "Tables", "Storage", "Lighting"]}
									/>
									<Select
										label="Collection"
										placeholder="Select collection"
										data={["Modern Living", "Minimalist", "Classic"]}
									/>
								</Stack>
							</Card.Section>
						</Card>

						{/* Tags */}
						<Card withBorder>
							<Card.Section inheritPadding py="md" pb="lg">
								<Text fw={600} size="sm">
									Tags
								</Text>
							</Card.Section>
							<Card.Section inheritPadding pb="md">
								<TextInput placeholder="Add tag..." />
							</Card.Section>
						</Card>
					</Stack>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
