import {
	Accordion,
	ActionIcon,
	Button,
	Card,
	Group,
	Stack,
	Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconArrowDown,
	IconArrowUp,
	IconEdit,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { notify } from "@/components/notify";
import { StatusBadge } from "@/components/StatusBadge";
import type { ContractProject } from "@/data/dummy";
import { ContractProjectModal } from "./ContractProjectModal";
import type { ContractProjectFormData } from "./contractProjectSchema";

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
					Delete <strong>{project.field}</strong> project? This action cannot be
					undone.
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

	const move = (index: number, direction: "up" | "down") => {
		const target = direction === "up" ? index - 1 : index + 1;
		if (target < 0 || target >= projects.length) return;
		const next = [...projects];
		[next[index], next[target]] = [next[target], next[index]];
		onChange(next);
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
					onClick={handleAdd}
				>
					Add project
				</Button>
			</Group>
			<Text size="xs" c="dimmed">
				Projects appear on the storefront in the order listed below.
			</Text>

			{projects.length === 0 ? (
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						No projects yet
					</Text>
				</Card>
			) : (
				<Accordion variant="separated">
					{projects.map((project, index) => (
						<Accordion.Item key={project.id} value={project.id}>
							<Group gap={0} wrap="nowrap">
								<Stack gap={2} px="xs">
									<ActionIcon
										size="sm"
										variant="subtle"
										color="gray"
										disabled={index === 0}
										aria-label="Move up"
										onClick={() => move(index, "up")}
									>
										<IconArrowUp size={14} />
									</ActionIcon>
									<ActionIcon
										size="sm"
										variant="subtle"
										color="gray"
										disabled={index === projects.length - 1}
										aria-label="Move down"
										onClick={() => move(index, "down")}
									>
										<IconArrowDown size={14} />
									</ActionIcon>
								</Stack>
								<Accordion.Control>
									<Group justify="space-between" wrap="nowrap">
										<Text>{project.field}</Text>
										<StatusBadge status={project.status} />
									</Group>
								</Accordion.Control>
							</Group>
							<Accordion.Panel>
								<Stack gap="sm">
									<Text size="sm">{project.description}</Text>
									<Group gap="xs">
										<Button
											size="xs"
											variant="default"
											leftSection={<IconEdit size={14} />}
											onClick={() => handleEdit(project)}
										>
											Edit
										</Button>
										<Button
											size="xs"
											color="red"
											variant="subtle"
											leftSection={<IconTrash size={14} />}
											onClick={() => confirmDelete(project)}
										>
											Delete
										</Button>
									</Group>
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
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
