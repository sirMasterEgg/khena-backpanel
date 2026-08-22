import { Button, Card, Group, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconFileTypePdf, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { notify } from "@/components/notify";
import type { AssemblyManual } from "@/data/dummy";
import { AssemblyManualModal } from "./AssemblyManualModal";
import { formatUpdatedAt } from "./format";

interface AssemblyManualsEditorProps {
	manuals: AssemblyManual[];
	onChange: (manuals: AssemblyManual[]) => void;
}

export function AssemblyManualsEditor({
	manuals,
	onChange,
}: AssemblyManualsEditorProps) {
	const [modalOpened, setModalOpened] = useState(false);
	const [editingManual, setEditingManual] = useState<AssemblyManual | null>(
		null,
	);

	const handleAdd = () => {
		setEditingManual(null);
		setModalOpened(true);
	};

	const handleReplace = (manual: AssemblyManual) => {
		setEditingManual(manual);
		setModalOpened(true);
	};

	const handleSave = (data: {
		productName: string;
		fileName: string;
		fileSize: string;
	}) => {
		if (editingManual) {
			onChange(
				manuals.map((m) =>
					m.id === editingManual.id
						? {
								...m,
								...data,
								updatedAt: new Date().toISOString().slice(0, 10),
							}
						: m,
				),
			);
			notify.success("Manual updated");
		} else {
			const newManual: AssemblyManual = {
				id: crypto.randomUUID(),
				updatedAt: new Date().toISOString().slice(0, 10),
				...data,
			};
			onChange([...manuals, newManual]);
			notify.success("Manual added");
		}
	};

	const confirmDelete = (manual: AssemblyManual) => {
		modals.openConfirmModal({
			title: "Delete manual",
			children: (
				<Text size="sm">
					Delete <strong>{manual.fileName}</strong>? This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => {
				onChange(manuals.filter((m) => m.id !== manual.id));
				notify.success("Manual deleted");
			},
		});
	};

	return (
		<>
			<Group justify="space-between" mb="md">
				<Text size="sm" c="dimmed">
					Upload assembly manual PDFs for each product.
				</Text>
				<Button
					size="xs"
					leftSection={<IconPlus size={14} />}
					onClick={handleAdd}
				>
					Add manual
				</Button>
			</Group>

			{manuals.length === 0 ? (
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						No manuals yet
					</Text>
				</Card>
			) : (
				<Table.ScrollContainer minWidth={600}>
					<Table striped highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Product</Table.Th>
								<Table.Th>File</Table.Th>
								<Table.Th>Size</Table.Th>
								<Table.Th>Updated</Table.Th>
								<Table.Th style={{ width: 160 }} />
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{manuals.map((manual) => (
								<Table.Tr key={manual.id}>
									<Table.Td>{manual.productName}</Table.Td>
									<Table.Td>
										<Group gap="xs" wrap="nowrap">
											<IconFileTypePdf size={16} />
											<Text size="sm">{manual.fileName}</Text>
										</Group>
									</Table.Td>
									<Table.Td>{manual.fileSize}</Table.Td>
									<Table.Td>{formatUpdatedAt(manual.updatedAt)}</Table.Td>
									<Table.Td>
										<Group gap="xs" wrap="nowrap">
											<Button
												size="xs"
												variant="default"
												onClick={() => handleReplace(manual)}
											>
												Replace
											</Button>
											<Button
												size="xs"
												color="red"
												variant="subtle"
												onClick={() => confirmDelete(manual)}
											>
												Delete
											</Button>
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			)}

			<AssemblyManualModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				onSave={handleSave}
				manual={editingManual}
			/>
		</>
	);
}
