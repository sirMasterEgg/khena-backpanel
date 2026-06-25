import {
	Button,
	Card,
	Container,
	Grid,
	Group,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import {
	IconFolderPlus,
	IconPhoto,
	IconSearch,
	IconUpload,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
	dummyMediaCategories,
	dummyMediaFiles,
	dummyMediaFolders,
	type MediaFile,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CategoryPanel } from "./CategoryPanel";
import type { FileTypeFilter } from "./FileTypePanel";
import { FileTypePanel } from "./FileTypePanel";
import { FolderCard } from "./FolderCard";
import { MediaCard } from "./MediaCard";
import { MediaDetailModal } from "./MediaDetailModal";
import { NewFolderModal } from "./NewFolderModal";

const SORT_OPTIONS = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "name-az", label: "Name A–Z" },
];

export function MediaLibrary() {
	usePageTitle("Media Library");

	const categories = dummyMediaCategories;

	const [files, setFiles] = useState<MediaFile[]>(dummyMediaFiles);
	const [folders, setFolders] = useState(dummyMediaFolders);

	const [search, setSearch] = useState("");
	const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
	const [openFolderId, setOpenFolderId] = useState<number | null>(null);
	const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
	const [sortBy, setSortBy] = useState<string>("newest");

	const [detailFile, setDetailFile] = useState<MediaFile | null>(null);
	const [newFolderOpened, setNewFolderOpened] = useState(false);

	const openFolder = folders.find((f) => f.id === openFolderId) ?? null;

	// Kategori target untuk pembuatan folder baru.
	const targetCategoryId =
		openFolder?.categoryId ?? activeCategoryId ?? categories[0].id;
	const targetCategoryName =
		categories.find((c) => c.id === targetCategoryId)?.name ?? "";

	// Jumlah file per kategori (untuk panel CATEGORIES).
	const countByCategory = useMemo(() => {
		const map: Record<number, number> = {};
		for (const file of files) {
			map[file.categoryId] = (map[file.categoryId] ?? 0) + 1;
		}
		return map;
	}, [files]);

	// Folder yang tampil di kolom kanan (hanya saat di akar kategori).
	const visibleFolders = useMemo(() => {
		if (openFolderId !== null) return [];
		return folders.filter(
			(f) => activeCategoryId === null || f.categoryId === activeCategoryId,
		);
	}, [folders, openFolderId, activeCategoryId]);

	// Derivasi file yang ditampilkan.
	const filteredFiles = useMemo(() => {
		let result = [...files];

		if (activeCategoryId !== null) {
			result = result.filter((f) => f.categoryId === activeCategoryId);
		}

		// Akar kategori → hanya file tanpa folder; selain itu → file folder aktif.
		result = result.filter((f) =>
			openFolderId === null ? f.folderId === null : f.folderId === openFolderId,
		);

		if (fileTypeFilter !== "all") {
			result = result.filter((f) => f.type === fileTypeFilter);
		}

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((f) => f.name.toLowerCase().includes(q));
		}

		switch (sortBy) {
			case "newest":
				result.sort(
					(a, b) =>
						new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
				);
				break;
			case "oldest":
				result.sort(
					(a, b) =>
						new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
				);
				break;
			case "name-az":
				result.sort((a, b) => a.name.localeCompare(b.name));
				break;
		}

		return result;
	}, [files, activeCategoryId, openFolderId, fileTypeFilter, search, sortBy]);

	// ----- Handlers -----

	const selectCategory = (id: number | null) => {
		setActiveCategoryId(id);
		setOpenFolderId(null);
	};

	const createFolder = (name: string) => {
		const folder = { id: Date.now(), name, categoryId: targetCategoryId };
		console.log("Create folder", folder);
		setFolders((prev) => [...prev, folder]);
	};

	const deleteFolder = (id: number) => {
		console.log("Delete folder", id);
		setFolders((prev) => prev.filter((f) => f.id !== id));
		setFiles((prev) => prev.filter((f) => f.folderId !== id));
		setOpenFolderId(null);
	};

	const deleteFile = (id: number) => {
		console.log("Delete file", id);
		setFiles((prev) => prev.filter((f) => f.id !== id));
	};

	const updateAltText = (id: number, value: string) => {
		console.log("Update altText", id, value);
		setFiles((prev) =>
			prev.map((f) => (f.id === id ? { ...f, altText: value } : f)),
		);
		setDetailFile((prev) =>
			prev && prev.id === id ? { ...prev, altText: value } : prev,
		);
	};

	const copyUrl = (url: string) => {
		navigator.clipboard.writeText(url);
	};

	const downloadFile = (file: MediaFile) => {
		console.log("Download file", file.id);
	};

	const uploadNew = () => {
		console.log("Upload new");
	};

	// ----- Derived display -----

	const title = openFolder
		? openFolder.name
		: activeCategoryId !== null
			? (categories.find((c) => c.id === activeCategoryId)?.name ??
				"Media Library")
			: "Media Library";

	const subtitle = openFolder
		? `${filteredFiles.length} files in this folder`
		: `${filteredFiles.length} files · ${visibleFolders.length} folders`;

	const detailCategoryName = detailFile
		? (categories.find((c) => c.id === detailFile.categoryId)?.name ?? "—")
		: "";
	const detailFolderName = detailFile
		? (folders.find((f) => f.id === detailFile.folderId)?.name ?? null)
		: null;

	return (
		<Container size="xl">
			<PageHeader
				title={title}
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
						<Button leftSection={<IconUpload size={16} />} onClick={uploadNew}>
							Upload New
						</Button>
					</Group>
				}
			/>

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
						placeholder="All Categories"
						data={categories.map((c) => ({
							value: String(c.id),
							label: c.name,
						}))}
						value={activeCategoryId !== null ? String(activeCategoryId) : null}
						onChange={(val) => selectCategory(val ? Number(val) : null)}
						clearable
						w={180}
					/>
					<Select
						data={[
							{ value: "all", label: "All File Types" },
							{ value: "image", label: "Image" },
							{ value: "video", label: "Video" },
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
							<CategoryPanel
								categories={categories}
								countByCategory={countByCategory}
								activeCategoryId={activeCategoryId}
								onSelectCategory={selectCategory}
								openFolderCategoryName={
									openFolder
										? (categories.find((c) => c.id === openFolder.categoryId)
												?.name ?? null)
										: null
								}
								onBack={() => setOpenFolderId(null)}
								onDeleteFolder={() => {
									if (openFolder) deleteFolder(openFolder.id);
								}}
							/>
						</Card>
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
					<Stack gap="lg">
						{/* Folders */}
						{visibleFolders.length > 0 && (
							<Stack gap="sm">
								<Text fw={600}>Folders ({visibleFolders.length})</Text>
								<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
									{visibleFolders.map((folder) => (
										<FolderCard
											key={folder.id}
											folder={folder}
											fileCount={
												files.filter((f) => f.folderId === folder.id).length
											}
											onOpen={() => {
												setActiveCategoryId(folder.categoryId);
												setOpenFolderId(folder.id);
											}}
											onRename={() => console.log("Rename folder", folder.id)}
											onDelete={() => deleteFolder(folder.id)}
										/>
									))}
								</SimpleGrid>
							</Stack>
						)}

						{/* Files */}
						{filteredFiles.length === 0 ? (
							<Stack align="center" gap="xs" py="xl">
								<IconPhoto size={48} color="var(--mantine-color-gray-5)" />
								<Text fw={500}>No files</Text>
								<Text size="sm" c="dimmed">
									Upload a file to get started.
								</Text>
							</Stack>
						) : (
							<Stack gap="sm">
								<Text fw={600}>Files ({filteredFiles.length})</Text>
								<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
									{filteredFiles.map((file) => (
										<MediaCard
											key={file.id}
											file={file}
											onOpenDetail={() => setDetailFile(file)}
											onCopyUrl={() => copyUrl(file.url)}
											onDownload={() => downloadFile(file)}
											onDelete={() => deleteFile(file.id)}
										/>
									))}
								</SimpleGrid>
							</Stack>
						)}
					</Stack>
				</Grid.Col>
			</Grid>

			{/* Modals */}
			<MediaDetailModal
				file={detailFile}
				categoryName={detailCategoryName}
				folderName={detailFolderName}
				onClose={() => setDetailFile(null)}
				onAltTextChange={updateAltText}
				onCopyUrl={copyUrl}
				onDownload={downloadFile}
				onDelete={deleteFile}
			/>
			<NewFolderModal
				opened={newFolderOpened}
				categoryName={targetCategoryName}
				onClose={() => setNewFolderOpened(false)}
				onCreate={createFolder}
			/>
		</Container>
	);
}
