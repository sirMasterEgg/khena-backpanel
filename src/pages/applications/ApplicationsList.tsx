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
	Select,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDots } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import { deleteApplicant, listApplicants } from "@/api/applicants";
import { getApiErrorMessage } from "@/api/client";
import { listJobs } from "@/api/jobs";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { useFilterParams } from "@/hooks/useFilterParams";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";

const ITEMS_PER_PAGE = 10;

export function ApplicationsList() {
	usePageTitle("Applications");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { can } = usePermissions();

	const canRead = can("applicant.read");
	const canDelete = can("applicant.delete");

	// "" = "All positions"
	const [filters, setFilters] = useFilterParams({
		job: "",
		page: 1,
	});

	// Opsi dropdown posisi — limit besar: dropdown butuh semua job, bukan
	// 10 pertama seperti paginasi default GET /jobs.
	const { data: jobs } = useQuery({
		queryKey: ["jobs", { forFilter: true }],
		queryFn: () => listJobs({ limit: 500 }),
	});

	const jobOptions = [
		{ value: "", label: "All positions" },
		...(jobs?.data.map((j) => ({ value: j.id, label: j.jobTitle })) ?? []),
	];

	// Aturan 2.5 — user bisa mengetik ?job=ngawur di address bar. Validasi
	// hanya setelah daftar job termuat, supaya id yang sah tidak sempat
	// ditolak sebelum `jobs` selesai fetch.
	const validJobIds = jobs ? new Set(jobs.data.map((j) => j.id)) : null;
	const job =
		validJobIds && filters.job !== "" && !validJobIds.has(filters.job)
			? ""
			: filters.job;

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["applicants", { job, page: filters.page }],
		queryFn: () =>
			listApplicants({
				job: job || undefined,
				page: filters.page,
				limit: ITEMS_PER_PAGE,
			}),
		placeholderData: (prev) => prev,
		enabled: canRead,
	});

	const applicants = data?.data ?? [];
	const total = data?.meta.total ?? 0;
	const totalPages = data?.meta.totalPages ?? 1;

	const handleJobChange = (value: string | null) => {
		setFilters({ job: value || "" });
	};

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteApplicant(id),
		onSuccess: () => {
			notify.success("Applicant dihapus");
			queryClient.invalidateQueries({ queryKey: ["applicants"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const confirmDelete = (id: string, name: string) => {
		modals.openConfirmModal({
			title: "Remove applicant",
			children: (
				<Text size="sm">
					Remove <strong>{name}</strong>? The applicant and their CV will be
					permanently deleted. This action cannot be undone.
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
					Jobs
				</Anchor>
				<Text size="sm" c="dimmed">
					Applications
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Applications"
				subtitle={`${total} total applications`}
				actions={
					<Button variant="default" onClick={() => navigate("/jobs")}>
						← Back to Jobs
					</Button>
				}
			/>

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group justify="space-between">
					<Select
						data={jobOptions}
						value={job}
						onChange={handleJobChange}
						allowDeselect={false}
						w={200}
					/>
					<Text size="sm" c="dimmed">
						{total} results
					</Text>
				</Group>
			</Card>

			{/* Table */}
			<Card withBorder>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Applicant</Table.Th>
							<Table.Th>Position</Table.Th>
							<Table.Th>Date</Table.Th>
							<Table.Th>CV</Table.Th>
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
						) : applicants.length > 0 ? (
							applicants.map((applicant) => (
								<Table.Tr key={applicant.id}>
									<Table.Td>
										<Stack gap={2}>
											<Text fw={500}>{applicant.name}</Text>
											<Text size="sm" c="dimmed">
												{applicant.email}
											</Text>
										</Stack>
									</Table.Td>
									<Table.Td>
										{applicant.jobs ? (
											applicant.jobs.jobTitle
										) : (
											<Text c="dimmed">Spontaneous</Text>
										)}
									</Table.Td>
									<Table.Td>
										{dayjs(applicant.date).format("DD MMM YYYY")}
									</Table.Td>
									<Table.Td>
										{applicant.cv ? (
											<Anchor
												href={applicant.cv.url}
												target="_blank"
												rel="noopener noreferrer"
												size="sm"
											>
												Download CV
											</Anchor>
										) : (
											<Text c="dimmed">No file</Text>
										)}
									</Table.Td>
									<Table.Td>
										{canDelete && (
											<Menu>
												<Menu.Target>
													<ActionIcon variant="subtle">
														<IconDots size={14} />
													</ActionIcon>
												</Menu.Target>
												<Menu.Dropdown>
													<Menu.Item
														color="red"
														onClick={() =>
															confirmDelete(applicant.id, applicant.name)
														}
													>
														Remove
													</Menu.Item>
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
									<Text c="dimmed">No applications yet</Text>
								</Table.Td>
							</Table.Tr>
						)}
					</Table.Tbody>
				</Table>

				{totalPages > 1 && (
					<Group justify="center" mt="md">
						<Pagination
							value={filters.page}
							onChange={(p) => setFilters({ page: p })}
							total={totalPages}
						/>
					</Group>
				)}
			</Card>
		</Container>
	);
}
