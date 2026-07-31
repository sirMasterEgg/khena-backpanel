import {
	ActionIcon,
	Button,
	Card,
	Center,
	Group,
	Loader,
	Pagination,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconBuildingStore,
	IconPlus,
	IconSearch,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { deleteSupplier, listSuppliers } from "@/api/suppliers";
import { notify } from "@/components/notify";
import { SupplierModal } from "./SupplierModal";

const ITEMS_PER_PAGE = 10;

interface SuppliersTabProps {
	/** Dikontrol dari PurchasingPage supaya tombol "Add supplier" di header bisa memicunya. */
	formOpened: boolean;
	onFormOpenedChange: (opened: boolean) => void;
}

export function SuppliersTab({
	formOpened,
	onFormOpenedChange,
}: SuppliersTabProps) {
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [page, setPage] = useState(1);
	const [editingId, setEditingId] = useState<string | null>(null);

	const params = {
		search: debouncedSearch || undefined,
		page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["suppliers", params],
		queryFn: () => listSuppliers(params),
	});

	const suppliers = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	const invalidateAfterMutation = () => {
		queryClient.invalidateQueries({ queryKey: ["suppliers"] });
		queryClient.invalidateQueries({ queryKey: ["purchase-orders", "stats"] });
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteSupplier(id),
		onSuccess: () => {
			notify.success("Supplier dihapus");
			invalidateAfterMutation();
		},
		onError: (err) => {
			const message = getApiErrorMessage(err);
			if (message.includes("supplier still has purchase orders")) {
				notify.error(
					"Supplier ini masih punya purchase order aktif. Hapus atau batalkan PO-nya dulu.",
				);
				return;
			}
			notify.error(message);
		},
	});

	const handleSearchChange = (value: string) => {
		setPage(1);
		setSearch(value);
	};

	const confirmDelete = (id: string, name: string) => {
		modals.openConfirmModal({
			title: "Delete supplier",
			children: (
				<Text size="sm">
					Delete <strong>{name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(id),
		});
	};

	const openEdit = (id: string) => setEditingId(id);
	const closeModal = () => {
		onFormOpenedChange(false);
		setEditingId(null);
	};

	return (
		<>
			<Card withBorder mb="md">
				<Group justify="space-between">
					<TextInput
						placeholder="Search by name, email, or phone"
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) => handleSearchChange(e.currentTarget.value)}
						w={280}
					/>
				</Group>
			</Card>

			<Card withBorder>
				{isLoading ? (
					<Center py="xl">
						<Loader />
					</Center>
				) : isError ? (
					<Text c="red" ta="center" py="xl">
						{getApiErrorMessage(error)}
					</Text>
				) : (
					<Table.ScrollContainer minWidth={700}>
						<Table striped highlightOnHover verticalSpacing="sm">
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Supplier</Table.Th>
									<Table.Th>Contact</Table.Th>
									<Table.Th>Phone</Table.Th>
									<Table.Th>Email</Table.Th>
									<Table.Th style={{ width: 48 }} />
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{suppliers.length > 0 ? (
									suppliers.map((supplier) => (
										<Table.Tr
											key={supplier.id}
											style={{ cursor: "pointer" }}
											onClick={() => openEdit(supplier.id)}
										>
											<Table.Td>
												<Text fw={500}>{supplier.name}</Text>
											</Table.Td>
											<Table.Td>{supplier.contactPerson || "—"}</Table.Td>
											<Table.Td>{supplier.phone || "—"}</Table.Td>
											<Table.Td>{supplier.email || "—"}</Table.Td>
											<Table.Td>
												<ActionIcon
													variant="subtle"
													color="red"
													aria-label="Delete supplier"
													onClick={(e) => {
														e.stopPropagation();
														confirmDelete(supplier.id, supplier.name);
													}}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									))
								) : (
									<Table.Tr>
										<Table.Td colSpan={5}>
											<Center py="xl">
												<Stack align="center" gap="sm">
													<IconBuildingStore
														size={36}
														color="var(--mantine-color-gray-5)"
													/>
													<Text c="dimmed">No suppliers yet</Text>
													<Button
														variant="light"
														leftSection={<IconPlus size={16} />}
														onClick={() => onFormOpenedChange(true)}
													>
														Add supplier
													</Button>
												</Stack>
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

			<SupplierModal
				opened={formOpened || Boolean(editingId)}
				supplierId={editingId ?? undefined}
				onClose={closeModal}
				onSuccess={invalidateAfterMutation}
			/>
		</>
	);
}
