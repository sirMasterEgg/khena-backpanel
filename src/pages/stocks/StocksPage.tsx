import { Anchor, Breadcrumbs, Button, Container, Grid, Group } from "@mantine/core";
import {
	IconAlertTriangle,
	IconClock,
	IconDownload,
	IconFileImport,
	IconStack2,
	IconTrendingDown,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getBlobApiErrorMessage } from "@/api/client";
import { downloadStockCsvExample, getStockStats } from "@/api/stocks";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { BulkUpdateCard } from "./BulkUpdateCard";
import { ImportStockCsvModal } from "./ImportStockCsvModal";
import { RecentActivityCard } from "./RecentActivityCard";
import { ReorderListCard } from "./ReorderListCard";
import { SingleSkuAdjustCard } from "./SingleSkuAdjustCard";

export function StocksPage() {
	usePageTitle("Stocks");
	const navigate = useNavigate();

	const [importOpened, setImportOpened] = useState(false);

	const statsQuery = useQuery({
		queryKey: ["stocks", "stats"],
		queryFn: getStockStats,
	});
	const stats = statsQuery.data;

	const downloadTemplateMutation = useMutation({
		mutationFn: downloadStockCsvExample,
		onSuccess: ({ blob, filename }) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		},
		// responseType "blob" membuat body error juga berupa Blob — pakai helper
		// async khusus supaya pesan asli dari server tetap terbaca.
		onError: async (err) => notify.error(await getBlobApiErrorMessage(err)),
	});

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
							loading={downloadTemplateMutation.isPending}
							onClick={() => downloadTemplateMutation.mutate()}
						>
							Download template
						</Button>
						<Button
							variant="filled"
							leftSection={<IconFileImport size={16} />}
							onClick={() => setImportOpened(true)}
						>
							Import CSV
						</Button>
					</Group>
				}
			/>

			{/* Stat cards — dari GET /stocks/stats. "—" selagi loading/gagal. */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconStack2 size={20} />}
						label="Total Inventory"
						value={stats?.totalInventory ?? "—"}
						subtitle={`across all products`}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconAlertTriangle size={20} />}
						label="Out of Stock"
						value={stats?.totalOutOfStock ?? "—"}
						subtitle="need restock"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconTrendingDown size={20} />}
						label="Running Low"
						value={stats?.totalRunningLow ?? "—"}
						subtitle="below reorder point"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
					<StatTile
						icon={<IconClock size={20} />}
						label="Updates Today"
						value={stats?.totalUpdatesToday ?? "—"}
						subtitle="stock changes today"
					/>
				</Grid.Col>
			</Grid>

			{/* Editor grid */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, md: 6 }}>
					<SingleSkuAdjustCard />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<BulkUpdateCard
						onOpenImport={() => setImportOpened(true)}
						onDownloadTemplate={() => downloadTemplateMutation.mutate()}
						downloadingTemplate={downloadTemplateMutation.isPending}
					/>
				</Grid.Col>
			</Grid>

			{/* Reorder list (kondisional — komponen mengembalikan null bila kosong) */}
			<ReorderListCard />

			{/* Recent activity */}
			<RecentActivityCard />

			<ImportStockCsvModal
				opened={importOpened}
				onClose={() => setImportOpened(false)}
			/>
		</Container>
	);
}
