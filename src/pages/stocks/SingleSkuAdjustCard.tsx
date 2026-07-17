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
import { useMemo, useState } from "react";
import { notify } from "@/components/notify";
import type { Product } from "@/data/dummy";
import { STOCK_REASONS } from "./stockData";
import type { ApplyResult, StockAction, StockSource } from "./stockTypes";

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
	const [change, setChange] = useState("");
	const [reason, setReason] = useState("");
	// Arah (+/−) ditentukan tombol toggle, bukan lagi dari reason.
	const [action, setAction] = useState<StockAction>("in");

	// Saran reason mengikuti arah toggle; tetap bisa diisi bebas.
	const reasonSuggestions = useMemo(
		() => STOCK_REASONS.filter((r) => r.action === action).map((r) => r.label),
		[action],
	);

	// Pencocokan SKU case-insensitive, trim spasi.
	const trimmedSku = sku.trim();
	const matched = useMemo(() => {
		if (!trimmedSku) return null;
		const q = trimmedSku.toLowerCase();
		return products.find((p) => p.sku.toLowerCase() === q) ?? null;
	}, [products, trimmedSku]);

	const handleApply = () => {
		const qty = Number(change.trim());

		if (!matched) {
			notify.error("No product with that SKU yet");
			return;
		}
		if (!change.trim() || Number.isNaN(qty) || qty <= 0) {
			notify.error("Enter a valid quantity (a positive number)");
			return;
		}
		if (!reason.trim()) {
			notify.error("Please enter a reason");
			return;
		}

		// Toggle in/out menentukan tanda perubahan.
		const signedChange = action === "out" ? -qty : qty;
		const result = onApply(
			matched.sku,
			signedChange,
			reason.trim(),
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
		setReason("");
		setAction("in");
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
								variant={action === "in" ? "filled" : "default"}
								color="green"
								onClick={() => setAction("in")}
							>
								Stock in (+)
							</Button>
							<Button
								variant={action === "out" ? "filled" : "default"}
								color="red"
								onClick={() => setAction("out")}
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
							value={sku}
							onChange={(e) => setSku(e.currentTarget.value)}
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
							value={change}
							onChange={(e) => setChange(e.currentTarget.value)}
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

				<Autocomplete
					label="Reason"
					placeholder="e.g. Received shipment"
					data={reasonSuggestions}
					value={reason}
					onChange={setReason}
				/>

				<Group justify="flex-end">
					<Button onClick={handleApply}>Apply update</Button>
				</Group>
			</Stack>
		</Card>
	);
}
