import {
	ActionIcon,
	Anchor,
	Breadcrumbs,
	Button,
	Card,
	Container,
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
import { IconDots, IconPlus, IconSearch } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import { deleteJob, listJobs } from "@/api/jobs";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";

const ITEMS_PER_PAGE = 10;
/** Jeda sebelum ketikan di kolom search dikirim ke server. */
const SEARCH_DEBOUNCE_MS = 400;
/** Batas aman untuk query penghitung subtitle — akurat selama total job < 100. */
const COUNT_LIMIT = 100;

export function JobsList() {
	usePageTitle("Jobs");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { can } = usePermissions();

	const canRead = can("job.read");
	const canCreate = can("job.create");
	const canUpdate = can("job.update");
	const canDelete = can("job.delete");

	// `search` = nilai input (langsung, biar ketikan responsif),
	// `debouncedSearch` = yang dikirim ke server.
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
	const [page, setPage] = useState(1);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["jobs", { search: debouncedSearch, page }],
		queryFn: () =>
			listJobs({
				search: debouncedSearch || undefined,
				page,
				limit: ITEMS_PER_PAGE,
			}),
		placeholderData: (prev) => prev,
		enabled: canRead,
	});

	const jobs = data?.data ?? [];
	const totalPages = data?.meta.totalPages ?? 1;

	// Penghitung subtitle — TIDAK ikut search/page, harus angka keseluruhan.
	// Tidak ada endpoint /jobs/stats, jadi hitung manual dari satu halaman besar.
	const { data: allJobs } = useQuery({
		queryKey: ["jobs", "counts"],
		queryFn: () => listJobs({ limit: COUNT_LIMIT }),
		enabled: canRead,
	});

	const openCount =
		allJobs?.data.filter((j) => j.status === "open").length ?? 0;
	const closedCount =
		allJobs?.data.filter((j) => j.status === "closed").length ?? 0;

	const handleSearchChange = (value: string) => {
		setPage(1);
		setSearch(value);
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteJob(id),
		onSuccess: () => {
			notify.success("Position dihapus");
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const confirmDelete = (id: string, title: string) => {
		modals.openConfirmModal({
			title: "Remove position",
			children: (
				<Text size="sm">
					Remove <strong>{title}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Remove", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(id),
		});
	};

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/jobs")}>
					Team
				</Anchor>
				<Text size="sm" c="dimmed">
					Jobs
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Open Positions"
				subtitle={`${openCount} open · ${closedCount} closed`}
				actions={
					<Group gap="sm">
						<Button variant="default" onClick={() => navigate("/applications")}>
							View Applications
						</Button>
						<Button
							leftSection={<IconPlus size={16} />}
							disabled={!canCreate}
							onClick={() => navigate("/jobs/new")}
						>
							Add Position
						</Button>
					</Group>
				}
			/>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<TextInput
					placeholder="Search positions…"
					leftSection={<IconSearch size={16} />}
					value={search}
					onChange={(e) => handleSearchChange(e.currentTarget.value)}
				/>
			</Card>

			{/* Table */}
			<Card withBorder>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Position</Table.Th>
							<Table.Th>Department</Table.Th>
							<Table.Th>Location</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th style={{ width: 60 }} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{isLoading ? (
							<Table.Tr>
								<Table.Td colSpan={5} style={{ padding: "2rem" }}>
									<Group justify="center">
										<Loader size="sm" />
									</Group>
								</Table.Td>
							</Table.Tr>
						) : isError ? (
							<Table.Tr>
								<Table.Td
									colSpan={5}
									style={{ textAlign: "center", padding: "2rem" }}
								>
									<Text c="red" size="sm">
										{getApiErrorMessage(error)}
									</Text>
								</Table.Td>
							</Table.Tr>
						) : jobs.length > 0 ? (
							jobs.map((job) => (
								<Table.Tr
									key={job.id}
									style={canUpdate ? { cursor: "pointer" } : undefined}
									onClick={
										canUpdate
											? () => navigate(`/jobs/${job.id}/edit`)
											: undefined
									}
								>
									<Table.Td>
										<span style={{ fontWeight: 500 }}>{job.jobTitle}</span>
									</Table.Td>
									<Table.Td>{job.department?.name || "—"}</Table.Td>
									<Table.Td>{job.location || "—"}</Table.Td>
									<Table.Td>
										<StatusBadge status={job.status} />
									</Table.Td>
									<Table.Td onClick={(e) => e.stopPropagation()}>
										{(canUpdate || canDelete) && (
											<Menu>
												<Menu.Target>
													<ActionIcon variant="subtle">
														<IconDots size={14} />
													</ActionIcon>
												</Menu.Target>
												<Menu.Dropdown>
													{canUpdate && (
														<Menu.Item
															onClick={() => navigate(`/jobs/${job.id}/edit`)}
														>
															Edit
														</Menu.Item>
													)}
													{canDelete && (
														<Menu.Item
															color="red"
															onClick={() =>
																confirmDelete(job.id, job.jobTitle)
															}
														>
															Remove
														</Menu.Item>
													)}
												</Menu.Dropdown>
											</Menu>
										)}
									</Table.Td>
								</Table.Tr>
							))
						) : (
							<Table.Tr>
								<Table.Td
									colSpan={5}
									style={{ textAlign: "center", padding: "2rem" }}
								>
									<Stack align="center" gap="sm">
										<Text c="dimmed">No positions yet</Text>
										<Button
											leftSection={<IconPlus size={16} />}
											disabled={!canCreate}
											onClick={() => navigate("/jobs/new")}
										>
											Add Position
										</Button>
									</Stack>
								</Table.Td>
							</Table.Tr>
						)}
					</Table.Tbody>
				</Table>

				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination value={page} onChange={setPage} total={totalPages} />
					</Group>
				)}
			</Card>
		</Container>
	);
}
