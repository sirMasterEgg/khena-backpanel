import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { dummyCategories, dummyRoomTypes } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { type CategoryFormData, categorySchema } from "./categorySchema";

export function CategoryEditor() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEdit = Boolean(id);

	const existing = isEdit
		? dummyCategories.find((c) => c.id === Number(id))
		: undefined;

	usePageTitle(isEdit ? "Edit Category" : "Add Category");

	const {
		control,
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			name: existing?.name ?? "",
			roomType: existing?.roomType ?? "",
			displayOrder: existing?.displayOrder ?? 0,
			status: existing?.status ?? "draft",
		},
	});

	// Mode "tambah room type baru" hanya mengubah tampilan input, bukan nilai form.
	const [isAddingRoomType, setIsAddingRoomType] = useState(false);

	const onSubmit = (data: CategoryFormData) => {
		console.log("Save category:", { id, ...data });
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
						<Button onClick={handleSubmit(onSubmit)}>Save</Button>
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
								{...register("name")}
								error={errors.name?.message}
							/>

							<Stack gap="xs">
								<div>
									<Text fw={500} size="sm">
										Room Type
									</Text>
									<Text size="xs" c="dimmed">
										Groups this category under a heading in the SHOP hover menu.
									</Text>
								</div>
								<Group gap="sm" align="flex-end">
									<Controller
										name="roomType"
										control={control}
										render={({ field }) =>
											isAddingRoomType ? (
												<TextInput
													placeholder="New room type name"
													value={field.value ?? ""}
													onChange={(e) =>
														field.onChange(e.currentTarget.value)
													}
													style={{ flex: 1 }}
													error={errors.roomType?.message}
												/>
											) : (
												<Select
													placeholder="Select room type"
													data={dummyRoomTypes}
													value={field.value || null}
													onChange={(v) => field.onChange(v ?? "")}
													style={{ flex: 1 }}
													error={errors.roomType?.message}
												/>
											)
										}
									/>
									<Button
										variant="subtle"
										size="sm"
										leftSection={
											isAddingRoomType ? (
												<IconX size={14} />
											) : (
												<IconPlus size={14} />
											)
										}
										onClick={() => {
											if (isAddingRoomType) {
												setIsAddingRoomType(false);
												setValue("roomType", existing?.roomType ?? "");
											} else {
												setIsAddingRoomType(true);
												setValue("roomType", "");
											}
										}}
									>
										{isAddingRoomType ? "Cancel" : "New Room Type"}
									</Button>
								</Group>
							</Stack>

							<Controller
								name="displayOrder"
								control={control}
								render={({ field }) => (
									<NumberInput
										label="Display order"
										description="Lower numbers appear first within the same room group."
										placeholder="0"
										min={0}
										value={field.value}
										onChange={(val) =>
											field.onChange(typeof val === "number" ? val : 0)
										}
										error={errors.displayOrder?.message}
									/>
								)}
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
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<Radio.Group value={field.value} onChange={field.onChange}>
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
								)}
							/>
						</Stack>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
