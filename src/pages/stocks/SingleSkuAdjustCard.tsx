import {
	Alert,
	Button,
	Card,
	Grid,
	Group,
	NumberInput,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { notify } from "@/components/notify";
import type { Product } from "@/data/dummy";
import { STOCK_REASON_GROUPS, STOCK_REASONS } from "./stockData";
import type { ApplyResult, StockAction, StockSource } from "./stockTypes";

// Selaraskan tanda nilai dengan arah reason: "out" → negatif, "in" → positif.
function applySign(
	value: number | string,
	action: StockAction | null,
): number | string {
	if (value === "" || action === null) return value;
	const num = typeof value === "number" ? value : Number(value);
	if (Number.isNaN(num)) return value;
	const magnitude = Math.abs(num);
	return action === "out" ? -magnitude : magnitude;
}

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
	const [sku, setSku] = useState("");
	const [change, setChange] = useState<number | string>("");
	const [reason, setReason] = useState<string | null>(null);

	// Arah (+/−) diturunkan dari reason terpilih.
	const reasonAction: StockAction | null = reason
		? (STOCK_REASONS.find((r) => r.value === reason)?.action ?? null)
		: null;

	// Ganti reason → sinkronkan tanda nilai change yang sudah diketik.
	const handleReasonChange = (val: string | null) => {
		setReason(val);
		const action = val
			? (STOCK_REASONS.find((r) => r.value === val)?.action ?? null)
			: null;
		setChange((prev) => applySign(prev, action));
	};

	// Ketik change → paksa tanda mengikuti reason (bila sudah dipilih).
	const handleChangeInput = (val: number | string) => {
		setChange(applySign(val, reasonAction));
	};

	// Pencocokan SKU case-insensitive, trim spasi.
	const trimmedSku = sku.trim();
	const matched = useMemo(() => {
		if (!trimmedSku) return null;
		const q = trimmedSku.toLowerCase();
		return products.find((p) => p.sku.toLowerCase() === q) ?? null;
	}, [products, trimmedSku]);

	const handleApply = () => {
		const changeValue = typeof change === "number" ? change : Number(change);

		if (!matched) {
			notify.error("No product with that SKU yet");
			return;
		}
		if (!changeValue || changeValue === 0) {
			notify.error("Change must not be zero");
			return;
		}
		if (!reason) {
			notify.error("Please select a reason");
			return;
		}

		const reasonLabel =
			STOCK_REASONS.find((r) => r.value === reason)?.label ?? reason;
		const result = onApply(
			matched.sku,
			changeValue,
			reasonLabel,
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
			`${matched.name} · ${result.newStock} in stock`,
			"Stock updated",
		);
		setSku("");
		setChange("");
		setReason(null);
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

				<Grid>
					<Grid.Col span={{ base: 12, xs: 6 }}>
						<TextInput
							label="SKU"
							placeholder="e.g. SOFA-001"
							value={sku}
							onChange={(e) => setSku(e.currentTarget.value)}
						/>
					</Grid.Col>
					<Grid.Col span={{ base: 12, xs: 6 }}>
						<NumberInput
							label="Change (+/−)"
							placeholder="e.g. 3"
							description={
								reasonAction === "out"
									? "Reason reduces stock (−)"
									: reasonAction === "in"
										? "Reason adds stock (+)"
										: "Pick a reason to set direction"
							}
							value={change}
							onChange={handleChangeInput}
							allowNegative
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

				<Select
					label="Reason"
					placeholder="Select a reason"
					data={STOCK_REASON_GROUPS}
					value={reason}
					onChange={handleReasonChange}
					searchable
				/>

				<Group justify="flex-end">
					<Button onClick={handleApply}>Apply update</Button>
				</Group>
			</Stack>
		</Card>
	);
}
