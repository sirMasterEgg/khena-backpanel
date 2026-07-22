import { zodResolver } from "@hookform/resolvers/zod";
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
import { useForm } from "react-hook-form";
import {
	getApiErrorCode,
	getApiErrorMessage,
	getApiFieldErrors,
} from "@/api/client";
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
import { BRAND_COLOR } from "@/data/constants.ts";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ColorEditorModal } from "./ColorEditorModal";
import { type FinishFormData, finishSchema } from "./finishSchema";
import { MaterialTypeCard } from "./MaterialTypeCard";

export function ColorList() {
	usePageTitle("Color");
	const queryClient = useQueryClient();

	const [isAdding, setIsAdding] = useState(false);
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

	// Grup "Brand" bawaan — read-only, tidak datang dari API. Bentuknya dipetakan
	// ke FinishWithColors supaya bisa dirender oleh MaterialTypeCard yang sama.
	const brandFinish: FinishWithColors = {
		id: "brand-locked",
		name: BRAND_COLOR.name,
		createdAt: "",
		updatedAt: "",
		colors: BRAND_COLOR.colors.map((c) => ({
			id: c.id,
			name: c.name,
			hexCode: c.hex,
			swatchPhoto: null,
			notes: null,
		})),
	};

	const invalidateFinishes = () =>
		queryClient.invalidateQueries({ queryKey: ["finishes"] });

	const {
		register: registerFinish,
		handleSubmit: handleFinishSubmit,
		reset: resetFinishForm,
		setError: setFinishError,
		formState: { errors: finishErrors },
	} = useForm<FinishFormData>({
		resolver: zodResolver(finishSchema),
		defaultValues: { name: "" },
	});

	const closeAddFinish = () => {
		setIsAdding(false);
		resetFinishForm({ name: "" });
	};

	const createFinishMutation = useMutation({
		mutationFn: (name: string) => createFinish({ finish: name }),
		onSuccess: () => {
			notify.success("Material type dibuat");
			closeAddFinish();
			invalidateFinishes();
		},
		onError: (err) => {
			// Tampilkan INLINE di field kalau errornya memang soal isi field —
			// duplikat (CONFLICT) atau validasi backend. Toast saja tidak cukup:
			// user perlu melihat penyebabnya menempel di input yang salah.
			const fieldErrors = getApiFieldErrors(err);
			const finishFieldError = fieldErrors.finish;
			if (finishFieldError) {
				setFinishError("name", { message: finishFieldError });
				return;
			}
			if (getApiErrorCode(err) === "CONFLICT") {
				setFinishError("name", { message: getApiErrorMessage(err) });
				return;
			}
			notify.error(getApiErrorMessage(err));
		},
	});

	const submitFinish = handleFinishSubmit(({ name }) => {
		// Cek duplikat di client dulu: backend membalas 400 CONFLICT untuk nama
		// yang sama, tapi menahannya di sini berarti user dapat jawaban instan
		// dan tidak ada request sia-sia.
		const duplicate = finishes.find(
			(f) => f.name.trim().toLowerCase() === name.toLowerCase(),
		);
		if (duplicate) {
			setFinishError("name", {
				message: `Material type "${duplicate.name}" sudah ada`,
			});
			return;
		}
		createFinishMutation.mutate(name);
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
					<form onSubmit={submitFinish} noValidate>
						<Stack gap="md">
							<Text fw={500} size="sm">
								New material type
							</Text>
							<Group align="flex-start">
								<TextInput
									placeholder="Material type name"
									{...registerFinish("name")}
									error={finishErrors.name?.message}
									style={{ flex: 1 }}
								/>
								<Button
									type="submit"
									size="sm"
									loading={createFinishMutation.isPending}
									disabled={createFinishMutation.isPending}
								>
									Add
								</Button>
								{/* type="button" WAJIB — tanpa itu tombol ikut men-submit form. */}
								<Button
									type="button"
									variant="default"
									size="sm"
									leftSection={<IconX size={14} />}
									onClick={closeAddFinish}
								>
									Cancel
								</Button>
							</Group>
						</Stack>
					</form>
				</Card>
			)}

			{/* Grup Brand terkunci selalu di atas, terlepas dari data API. */}
			<MaterialTypeCard finish={brandFinish} locked />

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
				// Diteruskan lengkap dengan `colors` — modal memerlukannya untuk
				// mencegah nama color duplikat dalam satu material type.
				finishes={finishes}
				finishId={editingFinishId}
				onClose={() => setModalOpened(false)}
				// Bersihkan state SETELAH animasi tutup selesai. Kalau di-reset
				// sinkron di onClose, judul & preview berkedip ke state kosong
				// selagi modal masih terlihat.
				onExited={() => {
					setEditingColor(undefined);
					setEditingFinishId(null);
				}}
			/>
		</Container>
	);
}
