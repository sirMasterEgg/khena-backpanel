import {
	Anchor,
	Breadcrumbs,
	Button,
	Container,
	Grid,
	Group,
	Menu,
} from "@mantine/core";
import {
	IconBarcode,
	IconChevronDown,
	IconCoin,
	IconDownload,
	IconFileImport,
	IconPlus,
	IconShoppingCart,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage, getBlobApiErrorMessage } from "@/api/client";
import {
	downloadMarketplaceTemplate,
	getMarketplaceStats,
	importMarketplaceOrdersCsv,
} from "@/api/marketplace";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import { formatIDR } from "@/utils/format";
import { ChannelCard } from "./ChannelCard";
import { HowItWorksCard } from "./HowItWorksCard";
import { LogOrderModal } from "./LogOrderModal";
import { MarketplaceOrdersCard } from "./MarketplaceOrdersCard";
import { MARKETPLACE_CHANNELS, normalizeChannel } from "./marketplaceChannels";

export function MarketplacesPage() {
	usePageTitle("Marketplaces");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { can } = usePermissions();

	const canRead = can("marketplace.read");
	const canCreate = can("marketplace.create");

	const [tab, setTab] = useState("all");
	const [logOpened, setLogOpened] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const statsQuery = useQuery({
		queryKey: ["marketplace", "stats"],
		queryFn: getMarketplaceStats,
		enabled: canRead,
	});
	const stats = statsQuery.data;

	const downloadTemplateMutation = useMutation({
		mutationFn: downloadMarketplaceTemplate,
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

	const importMutation = useMutation({
		mutationFn: importMarketplaceOrdersCsv,
		onSuccess: (data) => {
			// HTTP 200 TIDAK berarti semua baris berhasil (partial success).
			if (data.failedCount > 0) {
				notify.error(
					`${data.successCount} baris berhasil, ${data.failedCount} gagal dari ${data.total}.`,
					"Import selesai sebagian",
				);
			} else {
				notify.success(`${data.successCount} baris berhasil diimport.`);
			}
			if (data.successCount > 0) {
				queryClient.invalidateQueries({ queryKey: ["marketplace"] });
				queryClient.invalidateQueries({ queryKey: ["stocks"] });
				queryClient.invalidateQueries({ queryKey: ["products"] });
			}
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		// Reset value SEKARANG juga, supaya memilih file yang SAMA dua kali
		// tetap memicu event change.
		e.target.value = "";
		if (!file) return;
		if (!file.name.toLowerCase().endsWith(".csv")) {
			notify.error("File harus berekstensi .csv");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			notify.error("Ukuran file maksimum 10 MB");
			return;
		}
		importMutation.mutate(file);
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/marketplaces")}>
					Marketplaces
				</Anchor>
			</Breadcrumbs>

			<PageHeader
				title="Marketplaces"
				subtitle="Track your Tokopedia and Shopee orders in one place."
				actions={
					<Group>
						<Menu shadow="md" position="bottom-end" withinPortal>
							<Menu.Target>
								<Button
									variant="default"
									rightSection={<IconChevronDown size={16} />}
								>
									Import
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									leftSection={<IconDownload size={16} />}
									disabled={!canRead}
									onClick={() => downloadTemplateMutation.mutate()}
								>
									Download template
								</Menu.Item>
								<Menu.Item
									leftSection={<IconFileImport size={16} />}
									disabled={!canCreate}
									onClick={() => fileInputRef.current?.click()}
								>
									Import CSV
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
						<Button
							leftSection={<IconPlus size={16} />}
							disabled={!canCreate}
							onClick={() => setLogOpened(true)}
						>
							Log order
						</Button>
					</Group>
				}
			/>

			<HowItWorksCard
				onGetTemplate={() => downloadTemplateMutation.mutate()}
				loading={downloadTemplateMutation.isPending}
				disabled={!canRead}
			/>

			{/* Stat cards — dari GET /marketplace/stats. Angka ALL-TIME (issue.md §3.2). */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconCoin size={20} />}
						label="Marketplace Revenue"
						value={stats ? formatIDR(stats.totalRevenue) : "—"}
						subtitle="All time"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconShoppingCart size={20} />}
						label="Marketplace Orders"
						value={stats?.totalOrders ?? "—"}
						subtitle="All time"
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
					<StatTile
						icon={<IconBarcode size={20} />}
						label="Unique SKUs sold"
						value={stats?.uniqueSkus ?? "—"}
						subtitle="All time"
					/>
				</Grid.Col>
			</Grid>

			<Grid gap="md" mb="xl">
				{MARKETPLACE_CHANNELS.map((ch) => (
					<Grid.Col key={ch} span={{ base: 12, md: 6 }}>
						<ChannelCard
							channel={ch}
							// marketplace bisa null → normalizeChannel sudah null-safe.
							stats={stats?.channels.find(
								(c) => normalizeChannel(c.marketplace) === ch,
							)}
							onViewOrders={() => setTab(ch)}
						/>
					</Grid.Col>
				))}
			</Grid>

			<MarketplaceOrdersCard
				tab={tab}
				onTabChange={setTab}
				onDownloadTemplate={() => downloadTemplateMutation.mutate()}
			/>

			<LogOrderModal opened={logOpened} onClose={() => setLogOpened(false)} />

			<input
				ref={fileInputRef}
				type="file"
				accept=".csv,text/csv"
				hidden
				onChange={handleFilePicked}
			/>
		</Container>
	);
}
