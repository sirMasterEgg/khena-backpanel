import {
	Accordion,
	ActionIcon,
	Badge,
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
import { useMemo, useState } from "react";
import type { QnaItem } from "./landingTypes";
import { QnaItemModal } from "./QnaItemModal";
import type { QnaItemFormData } from "./qnaItemSchema";

interface QnaSectionEditorProps {
	items: QnaItem[];
	/** Selalu kirim SELURUH array — endpoint tidak punya DELETE (gotcha #10). */
	onChange: (items: QnaItem[]) => void;
	withCategory?: boolean; // true hanya untuk FAQ
	description: string; // teks keterangan di atas daftar
	/** Mutation sedang berjalan / user tidak punya izin — cegah PATCH balapan. */
	disabled?: boolean;
}

export function QnaSectionEditor({
	items,
	onChange,
	withCategory,
	description,
	disabled = false,
}: QnaSectionEditorProps) {
	const [modalOpened, setModalOpened] = useState(false);
	const [editingItem, setEditingItem] = useState<QnaItem | null>(null);

	// Kategori yang sudah pernah dipakai di item lain — jadi saran tambahan di
	// Autocomplete supaya penamaan kategori tetap konsisten antar item.
	const existingCategories = useMemo(
		() =>
			Array.from(
				new Set(
					items
						.map((i) => i.category?.trim())
						.filter((c): c is string => Boolean(c)),
				),
			),
		[items],
	);

	const handleAdd = () => {
		setEditingItem(null);
		setModalOpened(true);
	};

	const handleEdit = (item: QnaItem) => {
		setEditingItem(item);
		setModalOpened(true);
	};

	// notify.success dipindah ke onSuccess mutation di PagesPage.tsx — supaya
	// tidak muncul notif "berhasil" padahal request PATCH-nya gagal.
	const handleSave = (data: QnaItemFormData) => {
		if (editingItem) {
			onChange(
				items.map((i) => (i.id === editingItem.id ? { ...i, ...data } : i)),
			);
		} else {
			const newItem: QnaItem = {
				id: crypto.randomUUID(),
				updatedAt: new Date().toISOString().slice(0, 10),
				...data,
			};
			onChange([...items, newItem]);
		}
	};

	const confirmDelete = (item: QnaItem) => {
		modals.openConfirmModal({
			title: "Delete item",
			children: (
				<Text size="sm">
					Delete <strong>{item.question}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => onChange(items.filter((i) => i.id !== item.id)),
		});
	};

	const move = (index: number, direction: "up" | "down") => {
		const target = direction === "up" ? index - 1 : index + 1;
		if (target < 0 || target >= items.length) return;
		const next = [...items];
		[next[index], next[target]] = [next[target], next[index]];
		onChange(next);
	};

	return (
		<Stack gap="md">
			<Group justify="space-between" align="flex-start">
				<Text size="sm" c="dimmed">
					{description}
				</Text>
				<Button
					size="xs"
					leftSection={<IconPlus size={14} />}
					disabled={disabled}
					onClick={handleAdd}
				>
					Add item
				</Button>
			</Group>
			<Text size="xs" c="dimmed">
				Items appear on the storefront in the order listed below.
			</Text>

			{items.length === 0 ? (
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						No items yet
					</Text>
				</Card>
			) : (
				<Accordion variant="separated">
					{items.map((item, index) => (
						<Accordion.Item key={item.id} value={item.id}>
							<Group gap={0} wrap="nowrap">
								<Stack gap={2} px="xs">
									<ActionIcon
										size="sm"
										variant="subtle"
										color="gray"
										disabled={disabled || index === 0}
										aria-label="Move up"
										onClick={() => move(index, "up")}
									>
										<IconArrowUp size={14} />
									</ActionIcon>
									<ActionIcon
										size="sm"
										variant="subtle"
										color="gray"
										disabled={disabled || index === items.length - 1}
										aria-label="Move down"
										onClick={() => move(index, "down")}
									>
										<IconArrowDown size={14} />
									</ActionIcon>
								</Stack>
								<Accordion.Control>
									<Group justify="space-between" wrap="nowrap">
										<Text>{item.question}</Text>
										{withCategory && item.category && (
											<Badge variant="light">{item.category}</Badge>
										)}
									</Group>
								</Accordion.Control>
							</Group>
							<Accordion.Panel>
								<Stack gap="sm">
									<Text size="sm">{item.answer}</Text>
									<Group gap="xs">
										<Button
											size="xs"
											variant="default"
											leftSection={<IconEdit size={14} />}
											disabled={disabled}
											onClick={() => handleEdit(item)}
										>
											Edit
										</Button>
										<Button
											size="xs"
											color="red"
											variant="subtle"
											leftSection={<IconTrash size={14} />}
											disabled={disabled}
											onClick={() => confirmDelete(item)}
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

			<QnaItemModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				onSave={handleSave}
				item={editingItem}
				withCategory={withCategory}
				existingCategories={existingCategories}
			/>
		</Stack>
	);
}
