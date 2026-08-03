import {
	Avatar,
	Badge,
	Card,
	Center,
	Group,
	Loader,
	Pagination,
	Select,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { getMediaPreviewUrl } from "@/api/media";
import { listStockReorder, type StockReorderStatus } from "@/api/stocks";
import { StatusBadge } from "@/components/StatusBadge";

const STATUS_OPTIONS: { value: "all" | StockReorderStatus; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "OUT_OF_STOCK", label: "Out of stock" },
	{ value: "RUNNING_LOW", label: "Running low" },
];

export function ReorderListCard() {
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<"all" | StockReorderStatus>(
		"all",
	);

	const params = {
		page,
		limit: 10,
		status: statusFilter === "all" ? undefined : statusFilter,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["stocks", "reorder-list", params],
		queryFn: () => listStockReorder(params),
	});

	const items = data?.data ?? [];
	const total = data?.meta.total ?? 0;
	const totalPages = data?.meta.totalPages ?? 1;

	// Sama seperti perilaku lama: kartu disembunyikan kalau memang tidak ada
	// apa-apa untuk direorder. Kalau filter sedang aktif, tetap tampilkan
	// kartu (dengan empty state) supaya user tidak bingung filternya hilang.
	if (statusFilter === "all" && total === 0 && !isLoading) return null;

	return (
		<Card withBorder mb="xl">
			<Group justify="space-between" mb="md">
				<Group gap="xs">
					<Title order={4}>Reorder list</Title>
					<Badge variant="light" color="yellow">
						{total}
					</Badge>
				</Group>
				<Select
					data={STATUS_OPTIONS}
					value={statusFilter}
					onChange={(val) => {
						setStatusFilter((val as "all" | StockReorderStatus) ?? "all");
						setPage(1);
					}}
					allowDeselect={false}
					w={180}
				/>
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
				<Table.ScrollContainer minWidth={600}>
					<Table highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Product</Table.Th>
								<Table.Th>In stock</Table.Th>
								<Table.Th>Reorder at</Table.Th>
								<Table.Th>Status</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{items.length > 0 ? (
								items.map((item) => (
									<Table.Tr key={item.id}>
										<Table.Td>
											<Group gap="sm" wrap="nowrap">
												<Avatar
													src={
														item.image
															? getMediaPreviewUrl(item.image)
															: undefined
													}
													radius="sm"
													size={40}
												/>
												<Stack gap={2}>
													<Text size="sm" fw={500}>
														{item.name}
													</Text>
													<Text size="xs" c="dimmed">
														{item.sku}
													</Text>
												</Stack>
											</Group>
										</Table.Td>
										<Table.Td>{item.inStock}</Table.Td>
										<Table.Td>{item.reorderAt ?? "—"}</Table.Td>
										<Table.Td>
											<StatusBadge
												status={
													item.status === "OUT_OF_STOCK"
														? "outofstock"
														: "lowstock"
												}
											/>
										</Table.Td>
									</Table.Tr>
								))
							) : (
								<Table.Tr>
									<Table.Td colSpan={4}>
										<Center py="xl">
											<Text c="dimmed">No items to reorder</Text>
										</Center>
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			)}

			{totalPages > 1 && (
				<Group justify="center" mt="md">
					<Pagination value={page} onChange={setPage} total={totalPages} />
				</Group>
			)}
		</Card>
	);
}
