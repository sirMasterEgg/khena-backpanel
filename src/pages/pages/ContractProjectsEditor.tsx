import {
	Badge,
	Button,
	Card,
	Group,
	Image,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { notify } from "@/components/notify";
import { StatusBadge } from "@/components/StatusBadge";
import type { ContractProject } from "@/data/dummy";
import { ContractProjectModal } from "./ContractProjectModal";
import type { ContractProjectFormData } from "./contractProjectSchema";
import { formatUpdatedAt } from "./format";

interface ContractProjectsEditorProps {
	projects: ContractProject[];
	onChange: (projects: ContractProject[]) => void;
}

export function ContractProjectsEditor({
	projects,
	onChange,
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
			notify.success("Project updated");
		} else {
			const newProject: ContractProject = {
				id: crypto.randomUUID(),
				updatedAt: new Date().toISOString().slice(0, 10),
				...data,
			};
			onChange([...projects, newProject]);
			notify.success("Project added");
		}
	};

	const confirmDelete = (project: ContractProject) => {
		modals.openConfirmModal({
			title: "Delete project",
			children: (
				<Text size="sm">
					Delete <strong>{project.title}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => {
				onChange(projects.filter((p) => p.id !== project.id));
				notify.success("Project deleted");
			},
		});
	};

	return (
		<>
			<Group justify="space-between" mb="md">
				<Text size="sm" c="dimmed">
					Manage the projects shown on the trade / contract page.
				</Text>
				<Button
					size="xs"
					leftSection={<IconPlus size={14} />}
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
							<Card.Section>
								<Image src={project.coverUrl} h={140} fit="cover" />
							</Card.Section>
							<Stack gap={4} mt="sm">
								<Text fw={600}>{project.title}</Text>
								<Badge variant="light" w="fit-content">
									{project.field}
								</Badge>
								<Text size="sm" c="dimmed" lineClamp={2}>
									{project.description}
								</Text>
								<Group justify="space-between" mt="xs">
									<StatusBadge status={project.status} />
									<Text size="xs" c="dimmed">
										{formatUpdatedAt(project.updatedAt)}
									</Text>
								</Group>
								<Group gap="xs" mt="sm">
									<Button
										size="xs"
										variant="default"
										onClick={() => handleEdit(project)}
									>
										Edit
									</Button>
									<Button
										size="xs"
										color="red"
										variant="subtle"
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
		</>
	);
}
