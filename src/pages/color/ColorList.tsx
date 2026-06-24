import {
	Button,
	Card,
	Container,
	Group,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
	type Color,
	dummyMaterialTypes,
	type MaterialType,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ColorEditorModal } from "./ColorEditorModal";
import { MaterialTypeCard } from "./MaterialTypeCard";

export function ColorList() {
	usePageTitle("Color");
	const [materials, setMaterials] =
		useState<MaterialType[]>(dummyMaterialTypes);
	const [isAdding, setIsAdding] = useState(false);
	const [newName, setNewName] = useState("");
	const [modalOpened, setModalOpened] = useState(false);
	const [editingColor, setEditingColor] = useState<Color | undefined>();
	const [editingMaterialId, setEditingMaterialId] = useState<number | null>(
		null,
	);

	const deleteColor = (materialId: number, colorId: number) => {
		console.log(`Delete color ${colorId} from material ${materialId}`);
		setMaterials((prev) =>
			prev.map((m) =>
				m.id === materialId
					? { ...m, colors: m.colors.filter((c) => c.id !== colorId) }
					: m,
			),
		);
	};

	const deleteMaterial = (materialId: number) => {
		const material = materials.find((m) => m.id === materialId);
		if (material?.locked) {
			console.log("Cannot delete locked material");
			return;
		}
		console.log(`Delete material ${materialId}`);
		setMaterials((prev) => prev.filter((m) => m.id !== materialId));
	};

	const addMaterial = (name: string) => {
		if (!name.trim()) return;
		const newMaterial: MaterialType = {
			id: Date.now(),
			name,
			colors: [],
		};
		console.log("Add material:", newMaterial);
		// Newest non-locked material always on top.
		setMaterials((prev) => [...prev, newMaterial]);
		setNewName("");
		setIsAdding(false);
	};

	const saveColor = (
		targetMaterialId: number,
		color: Color,
		sourceMaterialId: number | null,
	) => {
		console.log(`Save color to material ${targetMaterialId}:`, color);
		setMaterials((prev) =>
			prev.map((m) => {
				// Moving to a different category: drop it from the source card.
				if (
					m.id === sourceMaterialId &&
					sourceMaterialId !== targetMaterialId
				) {
					return { ...m, colors: m.colors.filter((c) => c.id !== color.id) };
				}
				if (m.id === targetMaterialId) {
					const existing = m.colors.some((c) => c.id === color.id);
					return existing
						? {
								...m,
								colors: m.colors.map((c) => (c.id === color.id ? color : c)),
							}
						: { ...m, colors: [...m.colors, color] };
				}
				return m;
			}),
		);
	};

	const lockedMaterials = materials.filter((m) => m.locked);
	const editableMaterials = materials
		.filter((m) => !m.locked)
		.slice()
		.reverse();
	const categoryOptions = materials
		.filter((m) => !m.locked)
		.map((m) => ({ id: m.id, name: m.name }));

	return (
		<Container size="xl">
			<PageHeader
				title="Color"
				subtitle="Manage brand and material colors used across products."
				actions={
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => setIsAdding(true)}
					>
						Add material type
					</Button>
				}
			/>

			{lockedMaterials.map((material) => (
				<MaterialTypeCard
					key={material.id}
					material={material}
					onAddColor={() => {
						setEditingMaterialId(material.id);
						setEditingColor(undefined);
						setModalOpened(true);
					}}
					onEditColor={(color) => {
						setEditingMaterialId(material.id);
						setEditingColor(color);
						setModalOpened(true);
					}}
					onDeleteColor={(colorId) => deleteColor(material.id, colorId)}
					onDeleteMaterial={() => deleteMaterial(material.id)}
				/>
			))}

			{isAdding && (
				<Card withBorder mb="md">
					<Stack gap="md">
						<Text fw={500} size="sm">
							New material type
						</Text>
						<Group align="flex-end">
							<TextInput
								placeholder="Material type name"
								value={newName}
								onChange={(e) => setNewName(e.currentTarget.value)}
								style={{ flex: 1 }}
							/>
							<Button onClick={() => addMaterial(newName)} size="sm">
								Add
							</Button>
							<Button
								variant="default"
								size="sm"
								leftSection={<IconX size={14} />}
								onClick={() => {
									setIsAdding(false);
									setNewName("");
								}}
							>
								Cancel
							</Button>
						</Group>
					</Stack>
				</Card>
			)}

			{editableMaterials.map((material) => (
				<MaterialTypeCard
					key={material.id}
					material={material}
					onAddColor={() => {
						setEditingMaterialId(material.id);
						setEditingColor(undefined);
						setModalOpened(true);
					}}
					onEditColor={(color) => {
						setEditingMaterialId(material.id);
						setEditingColor(color);
						setModalOpened(true);
					}}
					onDeleteColor={(colorId) => deleteColor(material.id, colorId)}
					onDeleteMaterial={() => deleteMaterial(material.id)}
				/>
			))}

			<ColorEditorModal
				opened={modalOpened}
				initial={editingColor}
				categories={categoryOptions}
				categoryId={editingMaterialId}
				onClose={() => {
					setModalOpened(false);
					setEditingColor(undefined);
					setEditingMaterialId(null);
				}}
				onSave={(color, targetCategoryId) => {
					saveColor(targetCategoryId, color, editingMaterialId);
				}}
			/>
		</Container>
	);
}
