import {
	ActionIcon,
	Avatar,
	Badge,
	Card,
	Center,
	Group,
	Loader,
	Menu,
	Pagination,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconDots,
	IconEdit,
	IconSearch,
	IconTrash,
	IconUsers,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	type AdministratorListItem,
	deleteAdministrator,
	listAdministrators,
} from "@/api/administrators";
import { getApiErrorMessage } from "@/api/client";
import { listRoles } from "@/api/roles";
import { notify } from "@/components/notify";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/authStore";
import { UserFormModal } from "./UserFormModal";

const ITEMS_PER_PAGE = 10;

function initials(name: string) {
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase())
		.join("");
}

interface UsersTabProps {
	formOpened: boolean;
	onFormOpenedChange: (opened: boolean) => void;
}

export function UsersTab({ formOpened, onFormOpenedChange }: UsersTabProps) {
	const { can } = usePermissions();
	const currentAdminId = useAuthStore((state) => state.admin?.id);
	const queryClient = useQueryClient();

	const canReadRoles = can("role.read");
	const canEdit = can("administrator.update");
	const canDelete = can("administrator.delete");
	const canShowMenu = canEdit || canDelete;

	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [roleFilter, setRoleFilter] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [editingId, setEditingId] = useState<string | null>(null);

	const params = {
		search: debouncedSearch || undefined,
		roleId: roleFilter || undefined,
		page,
		limit: ITEMS_PER_PAGE,
	};

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["administrators", params],
		queryFn: () => listAdministrators(params),
	});
	const administrators = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	const roleOptionsQuery = useQuery({
		queryKey: ["roles", { limit: 100 }],
		queryFn: () => listRoles({ limit: 100 }),
		enabled: canReadRoles,
	});
	const roleFilterOptions = [
		{ value: "", label: "All roles" },
		...(roleOptionsQuery.data?.data ?? []).map((r) => ({
			value: r.id,
			label: r.name,
		})),
	];

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["administrators"] });
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteAdministrator(id),
		onSuccess: () => {
			notify.success("User deleted");
			invalidate();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleSearchChange = (value: string) => {
		setPage(1);
		setSearch(value);
	};

	const handleRoleFilterChange = (value: string | null) => {
		setPage(1);
		setRoleFilter(value || null);
	};

	const handleEdit = (id: string) => setEditingId(id);
	const closeModal = () => {
		onFormOpenedChange(false);
		setEditingId(null);
	};

	const confirmDelete = (item: AdministratorListItem) => {
		modals.openConfirmModal({
			title: "Delete user",
			children: (
				<Text size="sm">
					Delete <strong>{item.name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(item.id),
		});
	};

	return (
		<Stack gap="md">
			<Card withBorder>
				<Group>
					<TextInput
						placeholder="Search name or email"
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) => handleSearchChange(e.currentTarget.value)}
						w={280}
					/>
					{canReadRoles && (
						<Select
							placeholder="Filter by role"
							data={roleFilterOptions}
							value={roleFilter ?? ""}
							onChange={handleRoleFilterChange}
							clearable={false}
							w={220}
						/>
					)}
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
									<Table.Th>Name</Table.Th>
									<Table.Th>Email</Table.Th>
									<Table.Th>Role</Table.Th>
									{canShowMenu && <Table.Th style={{ width: 48 }} />}
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{administrators.length > 0 ? (
									administrators.map((item) => {
										const isSelf = item.id === currentAdminId;
										return (
											<Table.Tr
													key={item.id}
													onClick={
														canEdit ? () => handleEdit(item.id) : undefined
													}
													style={canEdit ? { cursor: "pointer" } : undefined}
												>
												<Table.Td>
													<Group gap="sm">
														<Avatar radius="xl">{initials(item.name)}</Avatar>
														<Group gap="xs">
															<Text fw={500}>{item.name}</Text>
															{isSelf && (
																<Badge size="xs" variant="light">
																	You
																</Badge>
															)}
														</Group>
													</Group>
												</Table.Td>
												<Table.Td>{item.email}</Table.Td>
												<Table.Td>
													{item.role ? (
														item.role.name
													) : (
														<Text c="dimmed">—</Text>
													)}
												</Table.Td>
												{canShowMenu && (
													<Table.Td onClick={(e) => e.stopPropagation()}>
														<Menu
															shadow="md"
															position="bottom-end"
															withinPortal
														>
															<Menu.Target>
																<ActionIcon variant="subtle" color="gray">
																	<IconDots size={16} />
																</ActionIcon>
															</Menu.Target>
															<Menu.Dropdown>
																{canEdit && (
																	<Menu.Item
																		leftSection={<IconEdit size={16} />}
																		onClick={() => handleEdit(item.id)}
																	>
																		Edit
																	</Menu.Item>
																)}
																{canDelete && (
																	<Tooltip
																		label="You cannot delete your own account"
																		disabled={!isSelf}
																	>
																		<Menu.Item
																			color="red"
																			leftSection={<IconTrash size={16} />}
																			disabled={isSelf}
																			onClick={() => confirmDelete(item)}
																		>
																			Delete
																		</Menu.Item>
																	</Tooltip>
																)}
															</Menu.Dropdown>
														</Menu>
													</Table.Td>
												)}
											</Table.Tr>
										);
									})
								) : (
									<Table.Tr>
										<Table.Td colSpan={canShowMenu ? 4 : 3}>
											<Center py="xl">
												<Stack align="center" gap="sm">
													<IconUsers
														size={36}
														color="var(--mantine-color-gray-5)"
													/>
													<Text c="dimmed">
														{debouncedSearch || roleFilter
															? "No users found"
															: "No users yet"}
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

			<UserFormModal
				opened={formOpened || Boolean(editingId)}
				administratorId={editingId ?? undefined}
				onClose={closeModal}
				onSuccess={invalidate}
			/>
		</Stack>
	);
}
