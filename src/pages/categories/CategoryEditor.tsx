import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Loader,
	NumberInput,
	Radio,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import {
	type CategoryInput,
	countCategoriesByRoomType,
	createCategory,
	getCategory,
	updateCategory,
} from "@/api/categories";
import { getApiErrorMessage } from "@/api/client";
import { createRoomType, deleteRoomType } from "@/api/roomTypes";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useRoomTypeOptions } from "@/hooks/useRoomTypeOptions";
import { type CategoryFormData, categorySchema } from "./categorySchema";

export function CategoryEditor() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { id } = useParams();
	const isEdit = Boolean(id);

	usePageTitle(isEdit ? "Edit Category" : "Add Category");

	const { data: category, isLoading } = useQuery({
		queryKey: ["categories", id],
		queryFn: () => getCategory(id as string),
		enabled: isEdit,
	});

	const { options: roomTypeOptions } = useRoomTypeOptions();

	// `values` (bukan `defaultValues`) supaya form ikut ter-update saat data detail datang.
	const values = useMemo<CategoryFormData | undefined>(
		() =>
			category
				? {
						category: category.category,
						roomTypeId: category.roomType.id,
						order: category.order,
						status: category.status,
					}
				: undefined,
		[category],
	);

	const {
		control,
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<CategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: {
			category: "",
			roomTypeId: "",
			order: 0,
			status: "draft",
		},
		values,
	});

	// Nama room type baru disimpan di state lokal — field form `roomTypeId`
	// SELALU berisi uuid (atau string kosong), tidak pernah teks nama.
	const [isAddingRoomType, setIsAddingRoomType] = useState(false);
	const [newRoomTypeName, setNewRoomTypeName] = useState("");

	const createRoomTypeMutation = useMutation({
		mutationFn: (name: string) => createRoomType({ roomType: name }),
		onSuccess: async (created) => {
			// `await` penting: setValue dijalankan setelah opsi ter-refresh, supaya
			// <Select> sudah punya option dgn id tsb saat nilainya di-set.
			await queryClient.invalidateQueries({ queryKey: ["room-types"] });
			setValue("roomTypeId", created.id, { shouldValidate: true });
			setIsAddingRoomType(false);
			setNewRoomTypeName("");
			notify.success("Room type dibuat");
		},
		onError: (error) => notify.error(getApiErrorMessage(error)),
	});

	const handleAddRoomType = () => {
		const name = newRoomTypeName.trim();
		if (!name) return;

		// Cegah duplikat di sisi client — backend tidak mendokumentasikan CONFLICT
		// untuk POST /room-types, jadi asumsikan nama dobel dibolehkan.
		const existing = roomTypeOptions.find(
			(o) => o.label.trim().toLowerCase() === name.toLowerCase(),
		);
		if (existing) {
			setValue("roomTypeId", existing.value, { shouldValidate: true });
			setIsAddingRoomType(false);
			setNewRoomTypeName("");
			return;
		}

		createRoomTypeMutation.mutate(name);
	};

	// Room type yang sedang terpilih — dibaca dari field form, bukan state terpisah.
	const selectedRoomTypeId = useWatch({ control, name: "roomTypeId" });
	const selectedRoomTypeName =
		roomTypeOptions.find((o) => o.value === selectedRoomTypeId)?.label ?? "";

	const deleteRoomTypeMutation = useMutation({
		mutationFn: (roomTypeId: string) => deleteRoomType(roomTypeId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["room-types"] });
			// WAJIB: field form tidak boleh menyimpan uuid yang sudah dihapus,
			// kalau tidak submit akan gagal dgn 400 room type not found.
			setValue("roomTypeId", "", { shouldValidate: true });
			notify.success("Room type dihapus");
		},
		onError: (error) => notify.error(getApiErrorMessage(error)),
	});

	// Pakai useMutation (bukan useQuery) karena dipicu aksi user, bukan render.
	const checkUsageMutation = useMutation({
		mutationFn: (roomTypeId: string) => countCategoriesByRoomType(roomTypeId),
		onSuccess: (usageCount, roomTypeId) => {
			if (usageCount > 0) {
				notify.error(
					`Room type ini masih dipakai oleh ${usageCount} category. ` +
						`Ubah atau hapus category tersebut dulu sebelum menghapus room type ini.`,
				);
				return;
			}

			modals.openConfirmModal({
				title: "Delete room type",
				children: (
					<Text size="sm">
						Delete <strong>{selectedRoomTypeName}</strong>? This action cannot
						be undone.
					</Text>
				),
				labels: { confirm: "Delete", cancel: "Cancel" },
				confirmProps: { color: "red" },
				onConfirm: () => deleteRoomTypeMutation.mutate(roomTypeId),
			});
		},
		// Gagal menghitung = status pemakaian tidak diketahui → jangan hapus.
		onError: (error) => notify.error(getApiErrorMessage(error)),
	});

	const isRoomTypeBusy =
		checkUsageMutation.isPending || deleteRoomTypeMutation.isPending;

	const mutation = useMutation({
		mutationFn: (body: CategoryInput) =>
			isEdit ? updateCategory(id as string, body) : createCategory(body),
		onSuccess: () => {
			notify.success(isEdit ? "Category diperbarui" : "Category dibuat");
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			navigate("/categories");
		},
		onError: (error) => notify.error(getApiErrorMessage(error)),
	});

	const onSubmit = (data: CategoryFormData) => {
		mutation.mutate(data);
	};

	if (isEdit && isLoading) {
		return (
			<Container size="xl">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<PageHeader
				title={isEdit ? "Edit Category" : "Add Category"}
				subtitle="Create a new categories and curate the products that define it."
				actions={
					<Group gap="sm">
						<Button
							type="button"
							variant="default"
							onClick={() => navigate("/categories")}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSubmit(onSubmit)}
							loading={mutation.isPending}
							disabled={mutation.isPending}
						>
							Save
						</Button>
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
								{...register("category")}
								error={errors.category?.message}
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
									{isAddingRoomType ? (
										<>
											<TextInput
												placeholder="New room type name"
												value={newRoomTypeName}
												onChange={(e) =>
													setNewRoomTypeName(e.currentTarget.value)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleAddRoomType();
													}
												}}
												style={{ flex: 1 }}
											/>
											<Button
												type="button"
												size="sm"
												leftSection={<IconPlus size={14} />}
												onClick={handleAddRoomType}
												loading={createRoomTypeMutation.isPending}
												disabled={
													!newRoomTypeName.trim() ||
													createRoomTypeMutation.isPending
												}
											>
												Add
											</Button>
											<Button
												type="button"
												variant="subtle"
												size="sm"
												leftSection={<IconX size={14} />}
												onClick={() => {
													// Pilihan sebelumnya dibiarkan utuh — jangan reset roomTypeId.
													setIsAddingRoomType(false);
													setNewRoomTypeName("");
												}}
											>
												Cancel
											</Button>
										</>
									) : (
										<>
											<Controller
												name="roomTypeId"
												control={control}
												render={({ field }) => (
													<Select
														placeholder="Select room type"
														data={roomTypeOptions}
														value={field.value || null}
														onChange={(v) => field.onChange(v ?? "")}
														style={{ flex: 1 }}
														error={errors.roomTypeId?.message}
													/>
												)}
											/>
											<Button
												type="button"
												variant="subtle"
												size="sm"
												leftSection={<IconPlus size={14} />}
												onClick={() => setIsAddingRoomType(true)}
											>
												New Room Type
											</Button>
											<Button
												type="button"
												variant="subtle"
												color="red"
												size="sm"
												leftSection={<IconTrash size={14} />}
												onClick={() =>
													checkUsageMutation.mutate(selectedRoomTypeId)
												}
												loading={isRoomTypeBusy}
												disabled={!selectedRoomTypeId || isRoomTypeBusy}
											>
												Delete
											</Button>
										</>
									)}
								</Group>
							</Stack>

							<Controller
								name="order"
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
										error={errors.order?.message}
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
