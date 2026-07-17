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
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { notify } from "@/components/notify";
import type { Product } from "@/data/dummy";
import {
	makeSingleSkuAdjustSchema,
	type SingleSkuAdjustFormData,
} from "./singleSkuAdjustSchema";
import { STOCK_REASONS } from "./stockData";
import type { ApplyResult, StockSource } from "./stockTypes";

interface SingleSkuAdjustCardProps {
	products: Product[];
	onApply: (
		sku: string,
		change: number,
		reasonLabel: string,
		source: StockSource,
		by: string,
	) => ApplyResult;
}

export function SingleSkuAdjustCard({
	products,
	onApply,
}: SingleSkuAdjustCardProps) {
	const schema = useMemo(() => makeSingleSkuAdjustSchema(products), [products]);

	const {
		register,
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm<SingleSkuAdjustFormData>({
		resolver: zodResolver(schema),
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

	// Pencocokan SKU case-insensitive, trim spasi (untuk baris status).
	const trimmedSku = skuValue.trim();
	const matched = useMemo(() => {
		if (!trimmedSku) return null;
		const q = trimmedSku.toLowerCase();
		return products.find((p) => p.sku.toLowerCase() === q) ?? null;
	}, [products, trimmedSku]);

	const onSubmit = (data: SingleSkuAdjustFormData) => {
		const matchedProduct = products.find(
			(p) => p.sku.toLowerCase() === data.sku.trim().toLowerCase(),
		);
		// Schema sudah menjamin ada kecocokan, ini hanya penjaga tipe.
		if (!matchedProduct) return;

		const qty = Number(data.change.trim());
		// Toggle in/out menentukan tanda perubahan.
		const signedChange = data.action === "out" ? -qty : qty;
		const result = onApply(
			matchedProduct.sku,
			signedChange,
			data.reason.trim(),
			"manual",
			"You",
		);

		if (!result.ok) {
			notify.error(
				result.reason === "negative"
					? "Stock cannot go below zero"
					: "No product with that SKU yet",
			);
			return;
		}

		notify.success(
			`${matchedProduct.name} · ${result.newStock} in stock`,
			"Stock updated",
		);
		reset({ sku: "", change: "", reason: "", action: "in" });
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

				{/* Baris status kecocokan: hanya setelah SKU diisi. */}
				{trimmedSku &&
					(matched ? (
						<Alert
							color="green"
							variant="light"
							icon={<IconCircleCheck size={16} />}
							p="xs"
						>
							<Text c="green" size="sm">
								{matched.name} · {matched.stock} in stock
							</Text>
						</Alert>
					) : (
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
					))}

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
					<Button onClick={handleSubmit(onSubmit)}>Apply update</Button>
				</Group>
			</Stack>
		</Card>
	);
}
