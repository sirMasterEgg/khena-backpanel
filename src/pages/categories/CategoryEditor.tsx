import {
	ActionIcon,
	Button,
	Card,
	Container,
	Grid,
	Group,
	NumberInput,
	Radio,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { dummyCategories, dummyRoomTypes } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CategoryEditor() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEdit = Boolean(id);

	const existing = isEdit
		? dummyCategories.find((c) => c.id === Number(id))
		: undefined;

	usePageTitle(isEdit ? "Edit Category" : "Add Category");

	const [name, setName] = useState(existing?.name ?? "");
	const [roomType, setRoomType] = useState<string | null>(
		existing?.roomType ?? null,
	);
	const [isAddingRoomType, setIsAddingRoomType] = useState(false);
	const [displayOrder, setDisplayOrder] = useState<number | string>(
		existing?.displayOrder ?? 0,
	);
	const [status, setStatus] = useState<string>(existing?.status ?? "draft");

	const handleSave = () => {
		console.log("Save category:", {
			id,
			name,
			roomType,
			displayOrder,
			status,
		});
		navigate("/categories");
	};

	return (
		<Container size="xl">
			<PageHeader
				title={isEdit ? "Edit Category" : "Add Category"}
				subtitle="Create a new categories and curate the products that define it."
				actions={
					<Group gap="sm">
						<Button variant="default" onClick={() => navigate("/categories")}>
							Cancel
						</Button>
						<Button onClick={handleSave}>Save</Button>
					</Group>
				}
			/>

			<Grid gap="lg">
				{/* KOLOM KIRI */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					{/* Group: Category Information */}
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Category Information</Text>
							<TextInput
								label="Category name"
								description="This name must exactly match the Category field on products."
								placeholder="e.g., Seating"
								value={name}
								onChange={(e) => setName(e.currentTarget.value)}
							/>

							{isAddingRoomType ? (
								<TextInput
									label="Room Type"
									description="Groups this category under a heading in the SHOP hover menu."
									placeholder="New room type name"
									value={roomType ?? ""}
									onChange={(e) => setRoomType(e.currentTarget.value)}
									rightSection={
										<ActionIcon
											size="xs"
											variant="subtle"
											onClick={() => {
												setIsAddingRoomType(false);
												setRoomType(existing?.roomType ?? null);
											}}
										>
											<IconX size={14} />
										</ActionIcon>
									}
								/>
							) : (
								<Select
									label="Room Type"
									description="Groups this category under a heading in the SHOP hover menu."
									placeholder="Select room type"
									data={dummyRoomTypes}
									value={roomType}
									onChange={setRoomType}
								/>
							)}
							<Button
								variant="subtle"
								size="xs"
								leftSection={<IconPlus size={14} />}
								onClick={() => {
									setIsAddingRoomType(true);
									setRoomType("");
								}}
							>
								+ new room type
							</Button>

							<NumberInput
								label="Display order"
								description="Lower numbers appear first within the same room group."
								placeholder="0"
								min={0}
								value={displayOrder}
								onChange={setDisplayOrder}
							/>
						</Stack>
					</Card>
				</Grid.Col>

				{/* KOLOM KANAN */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					{/* Group: Status */}
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Status</Text>
							<Radio.Group value={status} onChange={setStatus}>
								<Stack gap="sm">
									<Radio
										value="published"
										label="Published"
										description="Visible in the SHOP menu on the website"
									/>
									<Radio
										value="draft"
										label="Draft"
										description="Hidden from the website until published"
									/>
								</Stack>
							</Radio.Group>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
