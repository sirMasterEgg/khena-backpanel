import {
	Anchor,
	Breadcrumbs,
	Button,
	Container,
	FileButton,
	Grid,
	Group,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconClock,
	IconDownload,
	IconFileImport,
	IconStack2,
	IconTrendingDown,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { dummyProducts, type Product } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { BulkUpdateCard } from "./BulkUpdateCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { ReorderListCard } from "./ReorderListCard";
import { SingleSkuAdjustCard } from "./SingleSkuAdjustCard";
import { downloadTemplateCsv, parseStockCsv } from "./stockCsv";
import { initialActivity } from "./stockData";
import type { ApplyResult, StockActivity, StockSource } from "./stockTypes";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Bandingkan bagian tanggal (yyyy-mm-dd) dua ISO string.
function isSameDay(iso: string, ref: Date): boolean {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return false;
	return d.toDateString() === ref.toDateString();
}

export function StocksPage() {
	usePageTitle("Stocks");
	const navigate = useNavigate();

	// Mirror data dummy ke state supaya perubahan langsung tampil.
	const [products, setProducts] = useState<Product[]>(() => [...dummyProducts]);
	const [activity, setActivity] = useState<StockActivity[]>(() => [
		...initialActivity,
	]);

	const stats = useMemo(() => {
		const totalInventory = products.reduce((sum, p) => sum + p.stock, 0);
		const outOfStock = products.filter((p) => p.stock === 0).length;
		const runningLow = products.filter(
			(p) =>
				p.lowStockAlert !== undefined &&
				p.stock > 0 &&
				p.stock <= p.lowStockAlert,
		).length;
		const today = new Date();
		const updatesToday = activity.filter((a) => isSameDay(a.at, today)).length;
		return { totalInventory, outOfStock, runningLow, updatesToday };
	}, [products, activity]);

	// Handler terpusat untuk penyesuaian satu SKU (dipakai kartu manual).
	const applyChange = (
		sku: string,
		change: number,
		reasonLabel: string,
		source: StockSource,
		by: string,
	): ApplyResult => {
		const product = products.find(
			(p) => p.sku.toLowerCase() === sku.toLowerCase(),
		);
		if (!product) return { ok: false, reason: "not_found" };

		const newStock = product.stock + change;
		if (newStock < 0) return { ok: false, reason: "negative" };

		setProducts((prev) =>
			prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p)),
		);
		setActivity((prev) => [
			{
				id: crypto.randomUUID(),
				source,
				sku: product.sku,
				productName: product.name,
				change,
				reasonLabel,
				by,
				at: new Date().toISOString(),
			},
			...prev,
		]);
		return { ok: true, productName: product.name, newStock };
	};

	// Terapkan banyak baris dari CSV sekaligus (satu snapshot, akumulatif).
	const applyImport = (
		rows: { sku: string; action: "in" | "out"; qty: number; reason: string }[],
	) => {
		// Stok berjalan per id supaya baris dengan SKU sama terakumulasi benar.
		const runningStock = new Map(products.map((p) => [p.id, p.stock]));
		const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));
		const newActivities: StockActivity[] = [];
		const skipped: string[] = [];
		let updated = 0;

		for (const row of rows) {
			const product = bySku.get(row.sku.toLowerCase());
			if (!product) {
				skipped.push(row.sku);
				continue;
			}
			const change = row.action === "out" ? -row.qty : row.qty;
			const current = runningStock.get(product.id) ?? product.stock;
			const newStock = Math.max(0, current + change); // clamp ke 0
			runningStock.set(product.id, newStock);
			updated += 1;
			newActivities.push({
				id: crypto.randomUUID(),
				source: "import",
				sku: product.sku,
				productName: product.name,
				change,
				reasonLabel: row.reason || "Imported",
				by: "You",
				at: new Date().toISOString(),
			});
		}

		if (updated === 0 && skipped.length === 0) {
			notify.error("No valid rows found in the file");
			return;
		}

		if (updated > 0) {
			setProducts((prev) =>
				prev.map((p) =>
					runningStock.has(p.id)
						? { ...p, stock: runningStock.get(p.id) ?? p.stock }
						: p,
				),
			);
			setActivity((prev) => [...newActivities.reverse(), ...prev]);
		}

		const summary =
			skipped.length > 0
				? `${updated} updated, ${skipped.length} skipped`
				: `${updated} updated`;
		notify.success(summary, "Import complete");
	};

	const handleFile = (file: File | null) => {
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".csv")) {
			notify.error("Please upload a .csv file");
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			notify.error("File is too large (max 5MB)");
			return;
		}
		file.text().then((text) => applyImport(parseStockCsv(text)));
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/stocks")}>
					Stocks
				</Anchor>
			</Breadcrumbs>

			<PageHeader
				title="Stocks"
				subtitle="Update stock via file import or manual adjustment. Every change is logged."
				actions={
					<Group>
						<Button
							variant="default"
							leftSection={<IconDownload size={16} />}
							onClick={downloadTemplateCsv}
						>
							Download template
						</Button>
						<FileButton onChange={handleFile} accept=".csv">
							{(props) => (
								<Button
									{...props}
									variant="filled"
									leftSection={<IconFileImport size={16} />}
								>
									Import CSV
								</Button>
							)}
						</FileButton>
					</Group>
				}
			/>

			{/* Stat cards */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Inventory"
						value={stats.totalInventory}
						subtitle={`across ${products.length} SKUs`}
						delta={4}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconAlertTriangle size={20} />}
						label="Out of Stock"
						value={stats.outOfStock}
						subtitle="need restock"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconTrendingDown size={20} />}
						label="Running Low"
						value={stats.runningLow}
						subtitle="below reorder point"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconClock size={20} />}
						label="Updates Today"
						value={stats.updatesToday}
						subtitle="stock changes today"
					/>
				</Grid.Col>
			</Grid>

			{/* Editor grid */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, md: 6 }}>
					<SingleSkuAdjustCard products={products} onApply={applyChange} />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<BulkUpdateCard onFile={handleFile} />
				</Grid.Col>
			</Grid>

			{/* Reorder list (kondisional — komponen mengembalikan null bila kosong) */}
			<ReorderListCard products={products} />

			{/* Recent activity */}
			<RecentActivityCard activity={activity} />
		</Container>
	);
}
