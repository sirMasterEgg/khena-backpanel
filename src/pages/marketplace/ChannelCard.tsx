import {
	Button,
	Card,
	Center,
	Group,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import type { MarketplaceChannelStats } from "@/api/marketplace";
import { formatIDR } from "@/utils/format";
import { CHANNEL_META, type MarketplaceChannel } from "./marketplaceChannels";

interface ChannelCardProps {
	channel: MarketplaceChannel;
	/** undefined saat stats belum termuat / kanal belum punya transaksi. */
	stats?: MarketplaceChannelStats;
	onViewOrders: () => void;
}

export function ChannelCard({
	channel,
	stats,
	onViewOrders,
}: ChannelCardProps) {
	const meta = CHANNEL_META[channel];

	return (
		<Card withBorder p="md">
			<Group justify="space-between" mb="md" wrap="nowrap">
				<Group gap="sm">
					<Center
						w={40}
						h={40}
						style={{ background: meta.color, borderRadius: 8 }}
					>
						<Text c="white" fw={700}>
							{meta.initial}
						</Text>
					</Center>
					<Stack gap={0}>
						<Text fw={600}>{meta.label}</Text>
						<Text size="xs" c="dimmed">
							All time
						</Text>
					</Stack>
				</Group>
				<Button variant="subtle" size="xs" onClick={onViewOrders}>
					View orders
				</Button>
			</Group>

			<SimpleGrid cols={3}>
				<Stack gap={0}>
					<Text size="xs" c="dimmed">
						Revenue
					</Text>
					<Text fw={600}>{stats ? formatIDR(stats.revenue) : "—"}</Text>
				</Stack>
				<Stack gap={0}>
					<Text size="xs" c="dimmed">
						Orders
					</Text>
					<Text fw={600}>{stats?.orders ?? "—"}</Text>
				</Stack>
				<Stack gap={0}>
					<Text size="xs" c="dimmed">
						SKUs
					</Text>
					<Text fw={600}>{stats?.skus ?? "—"}</Text>
				</Stack>
			</SimpleGrid>
		</Card>
	);
}
