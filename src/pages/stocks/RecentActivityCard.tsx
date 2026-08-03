import {
	Anchor,
	Card,
	Center,
	Group,
	Loader,
	Text,
	Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { listStockActivity } from "@/api/stocks";
import { StockActivityModal } from "./StockActivityModal";
import { StockActivityTable } from "./StockActivityTable";

export function RecentActivityCard() {
	const [modalOpened, setModalOpened] = useState(false);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["stocks", "activity", { page: 1, limit: 5 }],
		queryFn: () => listStockActivity({ page: 1, limit: 5 }),
	});

	const items = data?.data ?? [];
	const total = data?.meta.total ?? 0;

	return (
		<Card withBorder>
			<Group justify="space-between" mb="md">
				<Title order={4}>Recent activity</Title>
				{total > 5 && (
					<Anchor
						size="sm"
						onClick={() => setModalOpened(true)}
						component="button"
						type="button"
					>
						View all ({total})
					</Anchor>
				)}
			</Group>

			{isLoading ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : isError ? (
				<Text c="red" ta="center" py="xl">
					{getApiErrorMessage(error)}
				</Text>
			) : (
				<StockActivityTable items={items} />
			)}

			<StockActivityModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
			/>
		</Card>
	);
}
