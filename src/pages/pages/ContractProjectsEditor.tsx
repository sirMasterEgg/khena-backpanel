import { Button, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { ContractProjectModal } from "./ContractProjectModal";
import type { ContractProjectFormData } from "./contractProjectSchema";
import type { ContractProject } from "./landingTypes";

interface ContractProjectsEditorProps {
	projects: ContractProject[];
	/** Selalu kirim SELURUH array — endpoint tidak punya DELETE (gotcha #10). */
	onChange: (projects: ContractProject[]) => void;
	/** Mutation sedang berjalan / user tidak punya izin — cegah PATCH balapan. */
	disabled?: boolean;
}

export function ContractProjectsEditor({
	projects,
	onChange,
	disabled = false,
}: ContractProjectsEditorProps) {
	const [modalOpened, setModalOpened] = useState(false);
	const [editingProject, setEditingProject] = useState<ContractProject | null>(
		null,
	);

	const handleAdd = () => {
		setEditingProject(null);
		setModalOpened(true);
	};

	const handleEdit = (project: ContractProject) => {
		setEditingProject(project);
		setModalOpened(true);
	};

	// notify.success dipindah ke onSuccess mutation di PagesPage.tsx.
	const handleSave = (data: ContractProjectFormData) => {
		if (editingProject) {
			onChange(
				projects.map((p) =>
					p.id === editingProject.id
						? {
								...p,
								...data,
								updatedAt: new Date().toISOString().slice(0, 10),
							}
						: p,
				),
			);
		} else {
			const newProject: ContractProject = {
				id: crypto.randomUUID(),
				updatedAt: new Date().toISOString().slice(0, 10),
				...data,
			};
			onChange([...projects, newProject]);
		}
	};

	const confirmDelete = (project: ContractProject) => {
		modals.openConfirmModal({
			title: "Delete project",
			children: (
				<Text size="sm">
					Delete <strong>{project.field}</strong> project? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => onChange(projects.filter((p) => p.id !== project.id)),
		});
	};

	return (
		<Stack gap="md">
			<Group justify="space-between" align="flex-start">
				<Text size="sm" c="dimmed">
					Manage the projects shown on the trade / contract page.
				</Text>
				<Button
					size="xs"
					leftSection={<IconPlus size={14} />}
					disabled={disabled}
					onClick={handleAdd}
				>
					Add project
				</Button>
			</Group>

			{projects.length === 0 ? (
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						No projects yet
					</Text>
				</Card>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
					{projects.map((project) => (
						<Card key={project.id} withBorder padding="lg">
							<Stack gap="xs">
								<Group justify="space-between" align="flex-start">
									<Text fw={600}>{project.field}</Text>
									<StatusBadge status={project.status} />
								</Group>
								<Text size="sm" c="dimmed">
									{project.description}
								</Text>
								<Group gap="xs" mt="sm">
									<Button
										size="xs"
										variant="default"
										leftSection={<IconEdit size={14} />}
										disabled={disabled}
										onClick={() => handleEdit(project)}
									>
										Edit
									</Button>
									<Button
										size="xs"
										color="red"
										variant="subtle"
										leftSection={<IconTrash size={14} />}
										disabled={disabled}
										onClick={() => confirmDelete(project)}
									>
										Delete
									</Button>
								</Group>
							</Stack>
						</Card>
					))}
				</SimpleGrid>
			)}

			<ContractProjectModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				onSave={handleSave}
				project={editingProject}
			/>
		</Stack>
	);
}
