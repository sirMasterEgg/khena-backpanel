import { zodResolver } from "@hookform/resolvers/zod";
import {
	Alert,
	Autocomplete,
	Button,
	Card,
	Grid,
	Group,
	Input,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/client";
import { createStockAdjustment, getStockSkuStatus } from "@/api/stocks";
import { notify } from "@/components/notify";
import {
	type SingleSkuAdjustFormData,
	singleSkuAdjustSchema,
} from "./singleSkuAdjustSchema";
import { STOCK_REASONS } from "./stockData";

export function SingleSkuAdjustCard() {
	const queryClient = useQueryClient();

	const {
		register,
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		setError,
		formState: { errors },
	} = useForm<SingleSkuAdjustFormData>({
		resolver: zodResolver(singleSkuAdjustSchema),
		defaultValues: {
			sku: "",
			change: "",
			reason: "",
			action: "in",
		},
	});

	// Arah (+/−) ditentukan tombol toggle, bukan lagi dari reason.
	const action = watch("action");
	const skuValue = watch("sku");

	// Saran reason mengikuti arah toggle; tetap bisa diisi bebas.
	const reasonSuggestions = useMemo(
		() => STOCK_REASONS.filter((r) => r.action === action).map((r) => r.label),
		[action],
	);

	// Debounce supaya tidak menembak API tiap ketukan keyboard.
	const [debouncedSku] = useDebouncedValue(skuValue.trim(), 400);

	const lookupQuery = useQuery({
		queryKey: ["stocks", "sku-status", debouncedSku],
		queryFn: () => getStockSkuStatus(debouncedSku),
		enabled: debouncedSku.length > 0,
		// WAJIB: "SKU tidak ketemu" dibalas 400. Tanpa ini React Query
		// mengulang 3x dengan backoff → Alert merah baru muncul beberapa
		// detik kemudian dan API dibanjiri request sia-sia.
		retry: false,
	});

	const mutation = useMutation({
		mutationFn: (data: SingleSkuAdjustFormData) =>
			createStockAdjustment({
				sku: data.sku.trim(),
				// PENTING: mapping toggle UI → nilai API
				adjustmentType: data.action === "out" ? "decrease" : "increase",
				quantity: Number(data.change.trim()), // selalu positif
				reason: data.reason.trim() || undefined,
			}),
		onSuccess: (result) => {
			// Response adjustment tidak memuat nama varian; pakai hasil lookup
			// bila ada supaya notifikasi sepersis versi lama.
			const label = lookupQuery.data?.name ?? result.sku;
			notify.success(
				`${label} · ${result.stockAfter} in stock`,
				"Stock updated",
			);
			reset({ sku: "", change: "", reason: "", action: "in" });
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
		onError: (err) => {
			const fieldErrors = getApiFieldErrors(err);
			if (Object.keys(fieldErrors).length > 0) {
				for (const [field, message] of Object.entries(fieldErrors)) {
					setError(field as keyof SingleSkuAdjustFormData, { message });
				}
				return;
			}
			notify.error(getApiErrorMessage(err));
		},
	});

	const onSubmit = (data: SingleSkuAdjustFormData) => {
		mutation.mutate(data);
	};

	return (
		<Card withBorder h="100%">
			<Stack gap="md">
				<Stack gap={2}>
					<Title order={4}>Adjust a single SKU</Title>
					<Text size="sm" c="dimmed">
						Update one product at a time and log the reason.
					</Text>
				</Stack>

				{/* Toggle arah: Stock in (+) / Stock out (−). */}
				<Input.Wrapper label="Direction">
					<div>
						<Button.Group>
							<Button
								type="button"
								variant={action === "in" ? "filled" : "default"}
								color="green"
								onClick={() => setValue("action", "in")}
							>
								Stock in (+)
							</Button>
							<Button
								type="button"
								variant={action === "out" ? "filled" : "default"}
								color="red"
								onClick={() => setValue("action", "out")}
							>
								Stock out (−)
							</Button>
						</Button.Group>
					</div>
				</Input.Wrapper>

				<Grid>
					<Grid.Col span={{ base: 12, xs: 6 }}>
						<TextInput
							label="SKU"
							placeholder="e.g. SOFA-001"
							{...register("sku")}
							error={errors.sku?.message}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, xs: 6 }}>
						<TextInput
							label="Change"
							placeholder="e.g. 3"
							inputMode="numeric"
							leftSection={
								<Text size="sm" c={action === "out" ? "red" : "green"}>
									{action === "out" ? "−" : "+"}
								</Text>
							}
							{...register("change")}
							error={errors.change?.message}
						/>
					</Grid.Col>
				</Grid>

				{/* Baris status stok: hanya setelah SKU diisi. */}
				{debouncedSku &&
					(lookupQuery.isFetching ? (
						<Alert color="gray" variant="light" p="xs">
							<Text c="dimmed" size="sm">
								Checking…
							</Text>
						</Alert>
					) : lookupQuery.data ? (
						<Alert
							color="green"
							variant="light"
							icon={<IconCircleCheck size={16} />}
							p="xs"
						>
							<Text c="green" size="sm">
								{lookupQuery.data.name} · {lookupQuery.data.inStock} in stock
							</Text>
						</Alert>
					) : lookupQuery.isError ? (
						<Alert
							color="red"
							variant="light"
							icon={<IconAlertCircle size={16} />}
							p="xs"
						>
							<Text c="red" size="sm">
								No product with that SKU yet
							</Text>
						</Alert>
					) : null)}

				<Controller
					name="reason"
					control={control}
					render={({ field }) => (
						<Autocomplete
							label="Reason"
							placeholder="e.g. Received shipment"
							data={reasonSuggestions}
							value={field.value}
							onChange={field.onChange}
							error={errors.reason?.message}
						/>
					)}
				/>

				<Group justify="flex-end">
					<Button
						onClick={handleSubmit(onSubmit)}
						loading={mutation.isPending}
						disabled={mutation.isPending}
					>
						Apply update
					</Button>
				</Group>
			</Stack>
		</Card>
	);
}
