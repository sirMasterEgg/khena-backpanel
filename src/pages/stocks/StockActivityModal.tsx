import {
	Center,
	Group,
	Loader,
	Modal,
	Pagination,
	Select,
	Stack,
	Text,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { listStockActivity, type StockActivitySource } from "@/api/stocks";
import { StockActivityTable } from "./StockActivityTable";

const SOURCE_OPTIONS: { value: "all" | StockActivitySource; label: string }[] =
	[
		{ value: "all", label: "All" },
		{ value: "ADJUSTMENT", label: "Manual" },
		{ value: "SYSTEM", label: "System" },
	];

interface StockActivityModalProps {
	opened: boolean;
	onClose: () => void;
}

export function StockActivityModal({
	opened,
	onClose,
}: StockActivityModalProps) {
	const [page, setPage] = useState(1);
	const [source, setSource] = useState<"all" | StockActivitySource>("all");

	const params = {
		page,
		limit: 10,
		source: source === "all" ? undefined : source,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["stocks", "activity", params],
		queryFn: () => listStockActivity(params),
		enabled: opened,
	});

	const items = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	return (
		<Modal opened={opened} onClose={onClose} title="Stock activity" size="lg">
			<Stack gap="md">
				<Group justify="flex-end">
					<Select
						label="Source"
						data={SOURCE_OPTIONS}
						value={source}
						onChange={(val) => {
							setSource((val as "all" | StockActivitySource) ?? "all");
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
					<StockActivityTable items={items} />
				)}

				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination value={page} onChange={setPage} total={totalPages} />
					</Group>
				)}
			</Stack>
		</Modal>
	);
}
