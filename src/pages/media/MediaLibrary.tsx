import {
	Button,
	Card,
	Container,
	Grid,
	Group,
	Loader,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
	IconFolderPlus,
	IconPhoto,
	IconSearch,
	IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import {
	browseMedia,
	createFolder,
	deleteFolder,
	deleteMediaFile,
	getMediaDownloadUrl,
	getMediaPreviewUrl,
	type MediaFile,
	type MediaFolder,
	type MediaSortField,
	patchMediaFile,
	updateFolder,
	uploadDirect,
} from "@/api/media";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { FileTypeFilter } from "./FileTypePanel";
import { FileTypePanel } from "./FileTypePanel";
import { FolderCard } from "./FolderCard";
import { MediaBreadcrumb } from "./MediaBreadcrumb";
import { MediaCard } from "./MediaCard";
import { MediaDetailModal } from "./MediaDetailModal";
import { NewFolderModal } from "./NewFolderModal";
import { RenameFolderModal } from "./RenameFolderModal";

const SORT_OPTIONS = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "name-az", label: "Name A–Z" },
];

/** Jeda sebelum ketikan di kolom search dikirim ke server. */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Batas ukuran per file untuk POST /media/upload-direct.
 * TODO(konfirmasi): angka ini dari keterangan PM, belum tertulis di
 * contract.md — minta backend mendokumentasikannya beserta error code-nya.
 */
const MAX_DIRECT_UPLOAD_BYTES = 120 * 1024 * 1024;

/** Opsi sort di UI tidak sama dgn kolom sort API — petakan dulu. */
function mapSortToApi(sortBy: string): MediaSortField {
	return sortBy === "name-az" ? "name" : "createdAt";
}

function mapOrderToApi(sortBy: string): "asc" | "desc" {
	return sortBy === "oldest" || sortBy === "name-az" ? "asc" : "desc";
}

/** "/produk/sofa" -> "/produk"; "/produk" -> "/". */
function parentPathOf(path: string) {
	const segments = path.split("/").filter(Boolean);
	segments.pop();
	return `/${segments.join("/")}`;
}

export function MediaLibrary() {
	usePageTitle("Media Library");
	const queryClient = useQueryClient();

	const [currentPath, setCurrentPath] = useState("/");

	// `search` = nilai input (langsung, biar ketikan responsif),
	// `debouncedSearch` = yang dikirim ke server.
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
	const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
	const [sortBy, setSortBy] = useState<string>("newest");

	const [detailFileId, setDetailFileId] = useState<string | null>(null);
	const [newFolderOpened, setNewFolderOpened] = useState(false);
	const [renameTarget, setRenameTarget] = useState<MediaFolder | null>(null);

	const uploadInputRef = useRef<HTMLInputElement>(null);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: [
			"media",
			currentPath,
			{ search: debouncedSearch, fileTypeFilter, sortBy },
		],
		queryFn: () =>
			browseMedia(currentPath, {
				search: debouncedSearch || undefined,
				type: fileTypeFilter === "all" ? undefined : fileTypeFilter,
				sort: mapSortToApi(sortBy),
				order: mapOrderToApi(sortBy),
			}),
		placeholderData: (prev) => prev,
	});

	// TODO(konfirmasi): belum jelas apakah GET /media sudah memfilter status
	// pending dari sisi backend. Kalau ternyata sudah, filter ini bisa dihapus.
	const files = (data?.files ?? []).filter((f) => f.status === "ready");

	// Search berlaku di SEMUA folder (contract.md bagian 7), jadi daftar folder
	// milik path aktif tidak relevan lagi saat sedang mencari.
	const isSearching = debouncedSearch.trim().length > 0;
	const folders = isSearching ? [] : (data?.folders ?? []);

	// Modal detail dibaca ulang dari hasil query supaya ikut ter-update setelah
	// PATCH dan otomatis tertutup kalau file-nya terhapus.
	const detailFile = files.find((f) => f.id === detailFileId) ?? null;

	const invalidateMedia = () =>
		queryClient.invalidateQueries({ queryKey: ["media"] });

	// ----- Mutations -----

	const createFolderMutation = useMutation({
		mutationFn: (folderName: string) =>
			createFolder({ path: currentPath, folderName }),
		onSuccess: () => {
			notify.success("Folder dibuat");
			setNewFolderOpened(false);
			invalidateMedia();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const renameFolderMutation = useMutation({
		mutationFn: ({ folder, name }: { folder: MediaFolder; name: string }) =>
			// `path` di endpoint ini = folder INDUK, bukan path folder itu sendiri.
			updateFolder(folder.id, {
				path: parentPathOf(folder.path),
				folderName: name,
			}),
		onSuccess: () => {
			notify.success("Folder di-rename");
			setRenameTarget(null);
			invalidateMedia();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const deleteFolderMutation = useMutation({
		mutationFn: (folder: MediaFolder) => deleteFolder(folder.id),
		onSuccess: (_result, folder) => {
			notify.success("Folder dihapus");
			// Kalau yang terhapus adalah folder aktif (atau induknya), path sekarang
			// sudah tidak ada — mundur ke induk folder tersebut.
			if (
				currentPath === folder.path ||
				currentPath.startsWith(`${folder.path}/`)
			) {
				setCurrentPath(parentPathOf(folder.path));
			}
			invalidateMedia();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const deleteFileMutation = useMutation({
		mutationFn: (id: string) => deleteMediaFile(id),
		onSuccess: (_result, id) => {
			notify.success("File dihapus");
			if (detailFileId === id) setDetailFileId(null);
			invalidateMedia();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const altTextMutation = useMutation({
		// `path` sengaja TIDAK dikirim — kalau ikut terkirim file akan berpindah
		// folder. Field yang tidak dikirim tidak diubah server.
		mutationFn: ({ id, altText }: { id: string; altText: string }) =>
			patchMediaFile(id, { file: { altText } }),
		onSuccess: () => {
			notify.success("Alt text disimpan");
			invalidateMedia();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const uploadMutation = useMutation({
		mutationFn: (selected: File[]) => uploadDirect(currentPath, selected),
		onSuccess: (result) => {
			notify.success(`${result.length} file diunggah`);
			invalidateMedia();
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	// ----- Handlers -----

	const confirmDeleteFolder = (folder: MediaFolder) => {
		modals.openConfirmModal({
			title: "Delete folder",
			children: (
				<Text size="sm">
					Hapus folder <strong>{folder.name}</strong>? Seluruh subfolder dan
					file di dalamnya ikut terhapus. Tindakan ini tidak bisa dibatalkan.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteFolderMutation.mutate(folder),
		});
	};

	const confirmDeleteFile = (id: string, name: string) => {
		modals.openConfirmModal({
			title: "Delete file",
			children: (
				<Text size="sm">
					Hapus <strong>{name}</strong>? Tindakan ini tidak bisa dibatalkan.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteFileMutation.mutate(id),
		});
	};

	const copyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
		notify.success("URL disalin");
	};

	const downloadFile = (file: MediaFile) => {
		// Endpoint download mengirim `content-disposition: attachment`, jadi cukup
		// diarahkan lewat anchor — tidak perlu mengambil blob sendiri.
		const link = document.createElement("a");
		link.href = getMediaDownloadUrl(file.id);
		link.rel = "noopener";
		document.body.appendChild(link);
		link.click();
		link.remove();
	};

	const handleFilesSelected = (fileList: FileList | null) => {
		const selected = Array.from(fileList ?? []);
		// Reset value supaya file yang sama bisa dipilih lagi setelah ini.
		if (uploadInputRef.current) uploadInputRef.current.value = "";
		if (selected.length === 0) return;

		// TODO(multipart): file > 120 MB harus lewat upload-multipart (Tahap 8).
		const tooBig = selected.filter((f) => f.size > MAX_DIRECT_UPLOAD_BYTES);
		const accepted = selected.filter((f) => f.size <= MAX_DIRECT_UPLOAD_BYTES);

		if (tooBig.length > 0) {
			notify.error(
				`File terlalu besar, maksimal 120 MB: ${tooBig
					.map((f) => f.name)
					.join(", ")}`,
			);
		}
		// Sebagian file kebesaran tidak membatalkan sisanya.
		if (accepted.length > 0) uploadMutation.mutate(accepted);
	};

	// ----- Derived display -----

	const currentFolderName =
		currentPath.split("/").filter(Boolean).pop() ?? "Media Library";

	const subtitle = isSearching
		? `Hasil pencarian "${debouncedSearch}" di semua folder`
		: `${files.length} files · ${folders.length} folders`;

	return (
		<Container size="xl">
			<PageHeader
				title={currentFolderName}
				subtitle={subtitle}
				actions={
					<Group gap="sm">
						<Button
							variant="default"
							leftSection={<IconFolderPlus size={16} />}
							onClick={() => setNewFolderOpened(true)}
						>
							New folder
						</Button>
						<Button
							leftSection={<IconUpload size={16} />}
							loading={uploadMutation.isPending}
							onClick={() => uploadInputRef.current?.click()}
						>
							Upload New
						</Button>
					</Group>
				}
			/>

			<input
				ref={uploadInputRef}
				type="file"
				multiple
				hidden
				onChange={(e) => handleFilesSelected(e.currentTarget.files)}
			/>

			<MediaBreadcrumb currentPath={currentPath} onNavigate={setCurrentPath} />

			{/* Toolbar */}
			<Card withBorder mb="md">
				<Group>
					<TextInput
						placeholder="Search Media..."
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						style={{ flex: 1, minWidth: 200 }}
					/>
					<Select
						data={[
							{ value: "all", label: "All File Types" },
							{ value: "image", label: "Image" },
							{ value: "video", label: "Video" },
							{ value: "audio", label: "Audio" },
							{ value: "document", label: "Document" },
						]}
						value={fileTypeFilter}
						onChange={(val) =>
							setFileTypeFilter((val as FileTypeFilter) ?? "all")
						}
						allowDeselect={false}
						w={160}
					/>
					<Select
						data={SORT_OPTIONS}
						value={sortBy}
						onChange={(val) => setSortBy(val ?? "newest")}
						allowDeselect={false}
						w={170}
						style={{ marginLeft: "auto" }}
						leftSection={<Text size="xs">Sort by:</Text>}
						leftSectionWidth={64}
					/>
				</Group>
			</Card>

			{/* Dua kolom */}
			<Grid gap="md">
				{/* Kolom kiri: filter */}
				<Grid.Col span={{ base: 12, md: 3 }}>
					<Stack gap="md">
						<Card withBorder>
							<FileTypePanel
								value={fileTypeFilter}
								onChange={setFileTypeFilter}
							/>
						</Card>
					</Stack>
				</Grid.Col>

				{/* Kolom kanan: konten */}
				<Grid.Col span={{ base: 12, md: 9 }}>
					{isLoading ? (
						<Group justify="center" py="xl">
							<Loader size="sm" />
						</Group>
					) : isError ? (
						<Text c="red" size="sm" ta="center" py="xl">
							{getApiErrorMessage(error)}
						</Text>
					) : (
						<Stack gap="lg">
							{/* Folders */}
							{folders.length > 0 && (
								<Stack gap="sm">
									<Text fw={600}>Folders ({folders.length})</Text>
									<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
										{folders.map((folder) => (
											<FolderCard
												key={folder.id}
												folder={folder}
												onOpen={() => setCurrentPath(folder.path)}
												onRename={() => setRenameTarget(folder)}
												onDelete={() => confirmDeleteFolder(folder)}
											/>
										))}
									</SimpleGrid>
								</Stack>
							)}

							{/* Files */}
							{files.length === 0 ? (
								<Stack align="center" gap="xs" py="xl">
									<IconPhoto size={48} color="var(--mantine-color-gray-5)" />
									<Text fw={500}>No files</Text>
									<Text size="sm" c="dimmed">
										Upload a file to get started.
									</Text>
								</Stack>
							) : (
								<Stack gap="sm">
									<Text fw={600}>Files ({files.length})</Text>
									<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
										{files.map((file) => (
											<MediaCard
												key={file.id}
												file={file}
												onOpenDetail={() => setDetailFileId(file.id)}
												onCopyUrl={() => copyUrl(getMediaPreviewUrl(file))}
												onDownload={() => downloadFile(file)}
												onDelete={() => confirmDeleteFile(file.id, file.name)}
											/>
										))}
									</SimpleGrid>
								</Stack>
							)}
						</Stack>
					)}
				</Grid.Col>
			</Grid>

			{/* Modals */}
			<MediaDetailModal
				file={detailFile}
				folderPath={isSearching ? "—" : currentPath}
				savingAltText={altTextMutation.isPending}
				onClose={() => setDetailFileId(null)}
				onSaveAltText={(id, altText) => altTextMutation.mutate({ id, altText })}
				onCopyUrl={copyUrl}
				onDownload={downloadFile}
				onDelete={(id) => confirmDeleteFile(id, detailFile?.name ?? "file ini")}
			/>
			<NewFolderModal
				opened={newFolderOpened}
				parentPath={currentPath}
				loading={createFolderMutation.isPending}
				onClose={() => setNewFolderOpened(false)}
				onCreate={(name) => createFolderMutation.mutate(name)}
			/>
			<RenameFolderModal
				folder={renameTarget}
				loading={renameFolderMutation.isPending}
				onClose={() => setRenameTarget(null)}
				onRename={(name) => {
					if (renameTarget) {
						renameFolderMutation.mutate({ folder: renameTarget, name });
					}
				}}
			/>
		</Container>
	);
}
