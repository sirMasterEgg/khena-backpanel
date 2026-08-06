import {
	ActionIcon,
	Badge,
	Card,
	Center,
	Group,
	Loader,
	Menu,
	Pagination,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconDots,
	IconEdit,
	IconSearch,
	IconShieldLock,
	IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { deleteRole, listRoles, type Role } from "@/api/roles";
import { notify } from "@/components/notify";
import { usePermissions } from "@/hooks/usePermissions";
import { RoleFormModal } from "./RoleFormModal";

const ITEMS_PER_PAGE = 10;

interface RolesTabProps {
	formOpened: boolean;
	onFormOpenedChange: (opened: boolean) => void;
}

export function RolesTab({ formOpened, onFormOpenedChange }: RolesTabProps) {
	const { can } = usePermissions();
	const queryClient = useQueryClient();

	const canEdit = can("role.update");
	const canDelete = can("role.delete");
	const canShowMenu = canEdit || canDelete;

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
		queryKey: ["roles", params],
		queryFn: () => listRoles(params),
	});
	const roles = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["roles"] });
		queryClient.invalidateQueries({ queryKey: ["administrators"] });
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteRole(id),
		onSuccess: () => {
			notify.success("Role deleted");
			invalidate();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleSearchChange = (value: string) => {
		setPage(1);
		setSearch(value);
	};

	const handleEdit = (id: string) => setEditingId(id);
	const closeModal = () => {
		onFormOpenedChange(false);
		setEditingId(null);
	};

	const confirmDelete = (role: Role) => {
		modals.openConfirmModal({
			title: "Delete role",
			children: (
				<Text size="sm">
					Delete <strong>{role.name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(role.id),
		});
	};

	return (
		<Stack gap="md">
			<Card withBorder>
				<Group>
					<TextInput
						placeholder="Search role"
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
									<Table.Th>Role name</Table.Th>
									<Table.Th>Description</Table.Th>
									<Table.Th>Permissions</Table.Th>
									{canShowMenu && <Table.Th style={{ width: 48 }} />}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{roles.length > 0 ? (
									roles.map((role) => (
										<Table.Tr
											key={role.id}
											onClick={canEdit ? () => handleEdit(role.id) : undefined}
											style={canEdit ? { cursor: "pointer" } : undefined}
										>
											<Table.Td>
												<Text fw={500}>{role.name}</Text>
											</Table.Td>
											<Table.Td>
												{role.description ?? <Text c="dimmed">—</Text>}
											</Table.Td>
											<Table.Td>
												{role.permissions.length > 0 ? (
													<Badge variant="light">
														{role.permissions.length} permissions
													</Badge>
												) : (
													<Badge variant="light" color="gray">
														No permissions
													</Badge>
												)}
											</Table.Td>
											{canShowMenu && (
												<Table.Td onClick={(e) => e.stopPropagation()}>
													<Menu shadow="md" position="bottom-end" withinPortal>
														<Menu.Target>
															<ActionIcon variant="subtle" color="gray">
																<IconDots size={16} />
															</ActionIcon>
														</Menu.Target>
														<Menu.Dropdown>
															{canEdit && (
																<Menu.Item
																	leftSection={<IconEdit size={16} />}
																	onClick={() => handleEdit(role.id)}
																>
																	Edit
																</Menu.Item>
															)}
															{canDelete && (
																<Menu.Item
																	color="red"
																	leftSection={<IconTrash size={16} />}
																	onClick={() => confirmDelete(role)}
																>
																	Delete
																</Menu.Item>
															)}
														</Menu.Dropdown>
													</Menu>
												</Table.Td>
											)}
										</Table.Tr>
									))
								) : (
									<Table.Tr>
										<Table.Td colSpan={canShowMenu ? 4 : 3}>
											<Center py="xl">
												<Stack align="center" gap="sm">
													<IconShieldLock
														size={36}
														color="var(--mantine-color-gray-5)"
													/>
													<Text c="dimmed">
														{debouncedSearch
															? "No roles found"
															: "No roles yet"}
													</Text>
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
					<Center mt="md">
						<Pagination value={page} onChange={setPage} total={totalPages} />
					</Center>
				)}
			</Card>

			<RoleFormModal
				opened={formOpened || Boolean(editingId)}
				roleId={editingId ?? undefined}
				onClose={closeModal}
				onSuccess={invalidate}
			/>
		</Stack>
	);
}
