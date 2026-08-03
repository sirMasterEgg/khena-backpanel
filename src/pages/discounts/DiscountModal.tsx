import { zodResolver } from "@hookform/resolvers/zod";
import {
	Box,
	Button,
	Center,
	Group,
	Loader,
	Modal,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { listCategories } from "@/api/categories";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import { listCollections } from "@/api/collections";
import { listCustomers } from "@/api/customers";
import {
	APPLIES_TO_LABELS,
	createDiscount,
	type DiscountAppliesToType,
	type DiscountInput,
	type DiscountPatchInput,
	type DiscountType,
	getDiscount,
	isEntityType,
	patchDiscount,
} from "@/api/discounts";
import { listProducts } from "@/api/products";
import { notify } from "@/components/notify";
import { type DiscountFormData, discountSchema } from "./discountSchema";

interface DiscountModalProps {
	opened: boolean;
	/** Ada → mode edit (fetch GET /discounts/:id lalu PATCH). Tidak ada → mode create (POST). */
	discountId?: string;
	onClose: () => void;
	onSuccess?: () => void;
}

const TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
	{ value: "percentage", label: "Percentage off" },
	{ value: "fixed_amount", label: "Fixed amount off" },
	{ value: "free_shipping", label: "Free shipping" },
];

const STATUS_OPTIONS = [
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
] as const;

const APPLIES_TO_OPTIONS: { value: DiscountAppliesToType; label: string }[] =
	Object.entries(APPLIES_TO_LABELS).map(([value, label]) => ({
		value: value as DiscountAppliesToType,
		label,
	}));

const emptyFormValues: DiscountFormData = {
	code: "",
	discountType: "percentage",
	discountValue: 0,
	appliesToType: "all_products",
	appliesToId: "",
	startDate: "",
	endDate: "",
	usageLimit: undefined,
	status: "active",
};

/** "2026-03-01" → "2026-03-01T00:00:00.000Z" */
const toStartIso = (d: string) => new Date(`${d}T00:00:00.000Z`).toISOString();
/** "2026-03-31" → "2026-03-31T23:59:59.999Z" — supaya endDate > startDate walau tanggalnya sama. */
const toEndIso = (d: string) => new Date(`${d}T23:59:59.999Z`).toISOString();

export function DiscountModal({
	opened,
	discountId,
	onClose,
	onSuccess,
}: DiscountModalProps) {
	const isEditing = Boolean(discountId);

	const detailQuery = useQuery({
		queryKey: ["discounts", discountId],
		queryFn: () => getDiscount(discountId as string),
		enabled: opened && Boolean(discountId),
	});
	const initial = detailQuery.data;

	const {
		control,
		handleSubmit,
		reset,
		setValue,
		setError,
		watch,
		formState: { errors },
	} = useForm<DiscountFormData>({
		resolver: zodResolver(discountSchema),
		defaultValues: emptyFormValues,
	});

	useEffect(() => {
		if (!opened) return;
		if (initial) {
			reset({
				code: initial.code,
				discountType: initial.discountType,
				discountValue: initial.discountValue,
				appliesToType: initial.appliesToType,
				appliesToId: initial.appliesToId ?? "",
				startDate: initial.startDate.slice(0, 10),
				endDate: initial.endDate.slice(0, 10),
				usageLimit: initial.usageLimit ?? undefined,
				status: initial.status === "inactive" ? "inactive" : "active",
			});
		} else if (!discountId) {
			reset(emptyFormValues);
		}
	}, [opened, initial, discountId, reset]);

	const discountType = watch("discountType");
	const appliesToType = watch("appliesToType") as DiscountAppliesToType;
	const isEntity = isEntityType(appliesToType);

	// ----- Picker target (appliesToId) — hanya untuk tipe entitas -----
	const [targetSearch, setTargetSearch] = useState("");
	const [debouncedTargetSearch] = useDebouncedValue(targetSearch, 300);

	const collectionsQuery = useQuery({
		queryKey: ["collections", { search: debouncedTargetSearch, limit: 20 }],
		queryFn: () =>
			listCollections({
				search: debouncedTargetSearch || undefined,
				limit: 20,
			}),
		enabled: opened && appliesToType === "collection",
	});
	const productsQuery = useQuery({
		queryKey: ["products", { search: debouncedTargetSearch, limit: 20 }],
		queryFn: () =>
			listProducts({ search: debouncedTargetSearch || undefined, limit: 20 }),
		enabled: opened && appliesToType === "product",
	});
	const categoriesQuery = useQuery({
		queryKey: ["categories", { search: debouncedTargetSearch, limit: 20 }],
		queryFn: () =>
			listCategories({ search: debouncedTargetSearch || undefined, limit: 20 }),
		enabled: opened && appliesToType === "category",
	});
	const customersQuery = useQuery({
		queryKey: ["customers", { search: debouncedTargetSearch, limit: 20 }],
		queryFn: () =>
			listCustomers({ search: debouncedTargetSearch || undefined, limit: 20 }),
		enabled: opened && appliesToType === "customer",
	});

	const targetOptions = useMemo(() => {
		let base: { value: string; label: string }[];
		switch (appliesToType) {
			case "collection":
				base = (collectionsQuery.data?.data ?? []).map((c) => ({
					value: c.id,
					label: c.name,
				}));
				break;
			case "product":
				base = (productsQuery.data?.data ?? []).map((p) => ({
					value: p.id,
					label: p.name,
				}));
				break;
			case "category":
				base = (categoriesQuery.data?.data ?? []).map((c) => ({
					value: c.id,
					// PERHATIKAN: label kategori adalah `category`, bukan `name`.
					label: c.category,
				}));
				break;
			case "customer":
				base = (customersQuery.data?.data ?? []).map((c) => ({
					value: c.id,
					label: c.name,
				}));
				break;
			default:
				base = [];
		}
		// Nilai tersimpan mungkin tidak ada di 20 hasil pertama — sisipkan dari detail.
		if (
			initial?.appliesToId &&
			initial.appliesToType === appliesToType &&
			!base.some((o) => o.value === initial.appliesToId)
		) {
			base = [
				{
					value: initial.appliesToId,
					label: initial.targetName ?? "(target tidak ditemukan)",
				},
				...base,
			];
		}
		return base;
	}, [
		appliesToType,
		collectionsQuery.data,
		productsQuery.data,
		categoriesQuery.data,
		customersQuery.data,
		initial,
	]);

	const buildCreateBody = (data: DiscountFormData): DiscountInput => {
		const isFree = data.discountType === "free_shipping";
		const entity = isEntityType(data.appliesToType as DiscountAppliesToType);
		return {
			code: data.code.trim().toUpperCase(),
			discountType: data.discountType,
			discountValue: isFree ? 0 : data.discountValue,
			appliesToType: data.appliesToType as DiscountAppliesToType,
			...(entity ? { appliesToId: data.appliesToId } : {}),
			startDate: toStartIso(data.startDate),
			endDate: toEndIso(data.endDate),
			usageLimit: data.usageLimit ?? undefined,
			status: data.status,
		};
	};

	const buildPatchBody = (data: DiscountFormData): DiscountPatchInput => {
		const isFree = data.discountType === "free_shipping";
		const entity = isEntityType(data.appliesToType as DiscountAppliesToType);
		return {
			code: data.code.trim().toUpperCase(),
			discountType: data.discountType,
			discountValue: isFree ? 0 : data.discountValue,
			appliesToType: data.appliesToType as DiscountAppliesToType,
			appliesToId: entity ? data.appliesToId : null,
			startDate: toStartIso(data.startDate),
			endDate: toEndIso(data.endDate),
			usageLimit: data.usageLimit ?? null,
			status: data.status,
		};
	};

	const mutation = useMutation({
		mutationFn: (data: DiscountFormData) => {
			if (discountId) {
				return patchDiscount(discountId, buildPatchBody(data));
			}
			return createDiscount(buildCreateBody(data));
		},
		onSuccess: () => {
			notify.success(isEditing ? "Discount diperbarui" : "Discount dibuat");
			onSuccess?.();
			onClose();
		},
		onError: (error) => {
			const fieldErrors = getApiFieldErrors(error);
			if (Object.keys(fieldErrors).length > 0) {
				for (const [field, message] of Object.entries(fieldErrors)) {
					setError(field as keyof DiscountFormData, { message });
				}
				return;
			}
			notify.error(getApiErrorMessage(error));
		},
	});

	const onSubmit = (data: DiscountFormData) => {
		mutation.mutate(data);
	};

	const isLoadingDetail = isEditing && detailQuery.isLoading;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEditing ? "Edit Discount" : "New Discount"}
			centered
		>
			{isLoadingDetail ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : (
				<form onSubmit={handleSubmit(onSubmit)}>
					<Stack gap="md">
						{/* Field kode dibungkus kotak highlight supaya menonjol. */}
						<Box
							p="md"
							style={{
								background: "var(--mantine-color-blue-light)",
								border: "1px solid var(--mantine-color-blue-light-hover)",
								borderRadius: "var(--mantine-radius-md)",
							}}
						>
							<Controller
								name="code"
								control={control}
								render={({ field }) => (
									<TextInput
										label="Discount code"
										required
										placeholder="e.g. WELCOME10"
										description="Pelanggan memasukkan kode ini saat checkout. Huruf besar & tanpa spasi."
										value={field.value}
										onChange={(e) =>
											field.onChange(
												e.currentTarget.value.toUpperCase().replace(/\s+/g, ""),
											)
										}
										error={errors.code?.message}
										styles={{ input: { fontFamily: "monospace" } }}
									/>
								)}
							/>
						</Box>

						<Group grow align="flex-start">
							<Controller
								name="discountType"
								control={control}
								render={({ field }) => (
									<Select
										label="Type"
										data={TYPE_OPTIONS}
										value={field.value}
										onChange={(val) =>
											field.onChange((val as DiscountType) ?? "percentage")
										}
										allowDeselect={false}
									/>
								)}
							/>
							{discountType === "free_shipping" ? (
								<TextInput label="Value" value="Free shipping" disabled />
							) : (
								<Controller
									name="discountValue"
									control={control}
									render={({ field }) => (
										<NumberInput
											label={
												discountType === "percentage"
													? "Value (%)"
													: "Value (Rp)"
											}
											placeholder={
												discountType === "percentage" ? "10" : "50000"
											}
											min={0}
											value={field.value}
											onChange={(val) =>
												field.onChange(typeof val === "number" ? val : 0)
											}
											error={errors.discountValue?.message}
										/>
									)}
								/>
							)}
						</Group>

						<Controller
							name="appliesToType"
							control={control}
							render={({ field }) => (
								<Select
									label="Applies to"
									data={APPLIES_TO_OPTIONS}
									value={field.value}
									onChange={(val) => {
										field.onChange(
											(val as DiscountAppliesToType) ?? "all_products",
										);
										setValue("appliesToId", "");
										setTargetSearch("");
									}}
									allowDeselect={false}
								/>
							)}
						/>

						{isEntity && (
							<Controller
								name="appliesToId"
								control={control}
								render={({ field }) => (
									<Select
										label="Target"
										placeholder="Cari target…"
										required
										searchable
										data={targetOptions}
										value={field.value || null}
										searchValue={targetSearch}
										onSearchChange={setTargetSearch}
										onChange={(val) => field.onChange(val ?? "")}
										error={errors.appliesToId?.message}
									/>
								)}
							/>
						)}

						<Group grow align="flex-start">
							<Controller
								name="startDate"
								control={control}
								render={({ field }) => (
									<DateInput
										label="Start date"
										placeholder="Pick start date"
										valueFormat="DD MMM YYYY"
										required
										value={field.value || null}
										onChange={(val) => field.onChange(val ?? "")}
										error={errors.startDate?.message}
									/>
								)}
							/>
							<Controller
								name="endDate"
								control={control}
								render={({ field }) => (
									<DateInput
										label="End date"
										placeholder="Pick end date"
										valueFormat="DD MMM YYYY"
										required
										value={field.value || null}
										onChange={(val) => field.onChange(val ?? "")}
										error={errors.endDate?.message}
									/>
								)}
							/>
						</Group>

						<Group grow align="flex-start">
							<Controller
								name="usageLimit"
								control={control}
								render={({ field }) => (
									<NumberInput
										label="Usage limit"
										description="Kosongkan untuk tanpa batas"
										inputWrapperOrder={["label", "input", "description"]}
										placeholder="No limit"
										min={1}
										value={field.value ?? ""}
										onChange={(val) =>
											field.onChange(typeof val === "number" ? val : undefined)
										}
										error={errors.usageLimit?.message}
									/>
								)}
							/>
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<Select
										label="Status"
										data={STATUS_OPTIONS}
										value={field.value}
										onChange={(val) =>
											field.onChange((val as "active" | "inactive") ?? "active")
										}
										allowDeselect={false}
									/>
								)}
							/>
						</Group>

						<Group justify="flex-end" gap="sm">
							<Button type="button" variant="default" onClick={onClose}>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={mutation.isPending}
								disabled={mutation.isPending}
							>
								{isEditing ? "Save changes" : "Create discount"}
							</Button>
						</Group>
					</Stack>
				</form>
			)}
		</Modal>
	);
}
