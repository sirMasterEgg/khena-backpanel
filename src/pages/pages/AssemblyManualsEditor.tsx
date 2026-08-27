import { Button, Card, Group, Table, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconFileTypePdf, IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { AssemblyManualModal } from "./AssemblyManualModal";
import { formatUpdatedAt } from "./format";
import type { AssemblyManual } from "./landingTypes";

interface AssemblyManualsEditorProps {
	manuals: AssemblyManual[];
	/** Selalu kirim SELURUH array — endpoint tidak punya DELETE (gotcha #10). */
	onChange: (manuals: AssemblyManual[]) => void;
	/** Mutation sedang berjalan / user tidak punya izin — cegah PATCH balapan. */
	disabled?: boolean;
}

export function AssemblyManualsEditor({
	manuals,
	onChange,
	disabled = false,
}: AssemblyManualsEditorProps) {
	const [modalOpened, setModalOpened] = useState(false);
	const [editingManual, setEditingManual] = useState<AssemblyManual | null>(
		null,
	);
	const [search, setSearch] = useState("");

	const filteredManuals = manuals.filter((m) =>
		m.productName.toLowerCase().includes(search.trim().toLowerCase()),
	);

	const handleAdd = () => {
		setEditingManual(null);
		setModalOpened(true);
	};

	const handleReplace = (manual: AssemblyManual) => {
		setEditingManual(manual);
		setModalOpened(true);
	};

	// notify.success dipindah ke onSuccess mutation di PagesPage.tsx.
	const handleSave = (data: {
		productName: string;
		productSku?: string;
		fileName: string;
		fileSize: string;
		fileUrl: string;
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
		} else {
			const newManual: AssemblyManual = {
				id: crypto.randomUUID(),
				updatedAt: new Date().toISOString().slice(0, 10),
				...data,
			};
			onChange([...manuals, newManual]);
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
			onConfirm: () => onChange(manuals.filter((m) => m.id !== manual.id)),
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
					disabled={disabled}
					onClick={handleAdd}
				>
					Add manual
				</Button>
			</Group>

			<TextInput
				placeholder="Search product..."
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => setSearch(e.currentTarget.value)}
				mb="md"
				w={280}
			/>

			{filteredManuals.length === 0 ? (
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						{search ? "No manuals match your search" : "No manuals yet"}
					</Text>
				</Card>
			) : (
				<Table.ScrollContainer minWidth={600}>
					<Table striped highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Product</Table.Th>
								<Table.Th>SKU</Table.Th>
								<Table.Th>File</Table.Th>
								<Table.Th>Size</Table.Th>
								<Table.Th>Updated</Table.Th>
								<Table.Th style={{ width: 160 }} />
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{filteredManuals.map((manual) => (
								<Table.Tr key={manual.id}>
									<Table.Td>{manual.productName}</Table.Td>
									<Table.Td>
										{manual.productSku ?? (
											<Text size="sm" c="dimmed">
												—
											</Text>
										)}
									</Table.Td>
									<Table.Td>
										<Group gap="xs" wrap="nowrap">
											<IconFileTypePdf size={16} />
											{manual.fileUrl ? (
												<Text
													component="a"
													href={manual.fileUrl}
													target="_blank"
													rel="noreferrer"
													size="sm"
												>
													{manual.fileName}
												</Text>
											) : (
												<Text size="sm">{manual.fileName}</Text>
											)}
										</Group>
									</Table.Td>
									<Table.Td>{manual.fileSize}</Table.Td>
									<Table.Td>{formatUpdatedAt(manual.updatedAt)}</Table.Td>
									<Table.Td>
										<Group gap="xs" wrap="nowrap">
											<Button
												size="xs"
												variant="default"
												disabled={disabled}
												onClick={() => handleReplace(manual)}
											>
												Replace
											</Button>
											<Button
												size="xs"
												color="red"
												variant="subtle"
												disabled={disabled}
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
				disabled={disabled}
			/>
		</>
	);
}
