import {
	Button,
	Card,
	Center,
	Container,
	Group,
	Loader,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { deleteColor } from "@/api/colors";
import {
	createFinish,
	deleteFinish,
	type FinishColor,
	type FinishWithColors,
	listFinishes,
} from "@/api/finishes";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ColorEditorModal } from "./ColorEditorModal";
import { MaterialTypeCard } from "./MaterialTypeCard";

export function ColorList() {
	usePageTitle("Color");
	const queryClient = useQueryClient();

	const [isAdding, setIsAdding] = useState(false);
	const [newName, setNewName] = useState("");
	const [modalOpened, setModalOpened] = useState(false);
	const [editingColor, setEditingColor] = useState<FinishColor | undefined>();
	const [editingFinishId, setEditingFinishId] = useState<string | null>(null);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["finishes"],
		// GET /finishes default limit-nya 10, sementara halaman ini menampilkan
		// semua kartu sekaligus tanpa pagination.
		// TODO(konfirmasi): `limit: 100` mengasumsikan jumlah finish sedikit. Kalau
		// nanti lebih dari itu, halaman ini perlu pagination / infinite scroll.
		queryFn: () => listFinishes({ limit: 100 }),
	});

	const finishes = data?.data ?? [];

	const invalidateFinishes = () =>
		queryClient.invalidateQueries({ queryKey: ["finishes"] });

	const createFinishMutation = useMutation({
		mutationFn: (name: string) => createFinish({ finish: name }),
		onSuccess: () => {
			notify.success("Material type dibuat");
			setNewName("");
			setIsAdding(false);
			invalidateFinishes();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const deleteFinishMutation = useMutation({
		mutationFn: (id: string) => deleteFinish(id),
		onSuccess: () => {
			notify.success("Material type dihapus");
			invalidateFinishes();
		},
		// Menampilkan apa adanya pesan backend, mis. "finish is still used by
		// N color(s)", supaya user paham kenapa gagal.
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const deleteColorMutation = useMutation({
		mutationFn: (id: string) => deleteColor(id),
		onSuccess: () => {
			notify.success("Color dihapus");
			// Yang di-invalidate ["finishes"], BUKAN ["colors"] — daftar color yang
			// tampil di layar datang dari response GET /finishes.
			invalidateFinishes();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const confirmDeleteFinish = (finish: FinishWithColors) => {
		modals.openConfirmModal({
			title: "Delete material type",
			children: (
				<Text size="sm">
					Delete <strong>{finish.name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteFinishMutation.mutate(finish.id),
		});
	};

	const confirmDeleteColor = (color: FinishColor) => {
		modals.openConfirmModal({
			title: "Delete color",
			children: (
				<Text size="sm">
					Delete <strong>{color.name}</strong>? This action cannot be undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteColorMutation.mutate(color.id),
		});
	};

	const openColorModal = (finishId: string, color?: FinishColor) => {
		setEditingFinishId(finishId);
		setEditingColor(color);
		setModalOpened(true);
	};

	const finishOptions = finishes.map((f) => ({ id: f.id, name: f.name }));

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
							<Button
								size="sm"
								loading={createFinishMutation.isPending}
								disabled={!newName.trim() || createFinishMutation.isPending}
								onClick={() => createFinishMutation.mutate(newName.trim())}
							>
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

			{isLoading ? (
				<Center py="xl">
					<Loader />
				</Center>
			) : isError ? (
				<Text c="red" ta="center" py="xl">
					{getApiErrorMessage(error)}
				</Text>
			) : finishes.length === 0 ? (
				<Card withBorder>
					<Text c="dimmed" ta="center" py="xl">
						Belum ada material type. Klik "Add material type" untuk memulai.
					</Text>
				</Card>
			) : (
				// Urutan mengikuti server apa adanya, supaya konsisten setelah refresh.
				finishes.map((finish) => (
					<MaterialTypeCard
						key={finish.id}
						finish={finish}
						onAddColor={() => openColorModal(finish.id)}
						onEditColor={(color) => openColorModal(finish.id, color)}
						onDeleteColor={confirmDeleteColor}
						onDeleteFinish={() => confirmDeleteFinish(finish)}
					/>
				))
			)}

			<ColorEditorModal
				opened={modalOpened}
				initial={editingColor}
				finishes={finishOptions}
				finishId={editingFinishId}
				onClose={() => {
					setModalOpened(false);
					setEditingColor(undefined);
					setEditingFinishId(null);
				}}
			/>
		</Container>
	);
}
