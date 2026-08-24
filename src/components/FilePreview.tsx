import { Box, Center, Image, Stack, Text } from "@mantine/core";
import {
	IconFile,
	IconFileMusic,
	IconFileTypeCsv,
	IconFileTypeDoc,
	IconFileTypeDocx,
	IconFileTypePdf,
	IconFileTypePpt,
	IconFileTypeTxt,
	IconFileTypeXls,
	IconFileTypeZip,
	IconVideo,
} from "@tabler/icons-react";
import { getMediaPreviewUrl, type MediaFile } from "@/api/media";

/**
 * Peta ekstensi → ikon. Tabler tidak punya varian "xlsx"/"pptx", jadi
 * ekstensi modern-nya diarahkan ke ikon versi lama yang bentuknya sama.
 */
const EXTENSION_ICONS: Record<string, typeof IconFile> = {
	pdf: IconFileTypePdf,
	doc: IconFileTypeDoc,
	docx: IconFileTypeDocx,
	xls: IconFileTypeXls,
	xlsx: IconFileTypeXls,
	ppt: IconFileTypePpt,
	pptx: IconFileTypePpt,
	txt: IconFileTypeTxt,
	csv: IconFileTypeCsv,
	zip: IconFileTypeZip,
	rar: IconFileTypeZip,
};

/** Fallback per tipe kalau ekstensinya tidak dikenali. */
const TYPE_ICONS = {
	video: IconVideo,
	audio: IconFileMusic,
	document: IconFile,
	image: IconFile,
} as const;

export function getFileIcon(file: Pick<MediaFile, "extension" | "type">) {
	const ext = file.extension?.replace(/^\./, "").toLowerCase() ?? "";
	return EXTENSION_ICONS[ext] ?? TYPE_ICONS[file.type] ?? IconFile;
}

interface FilePreviewProps {
	file: MediaFile;
	/** Tinggi kotak preview. Samakan dengan tinggi <Image> yang digantikan. */
	h?: number | string;
	fit?: "cover" | "contain";
	/** Tampilkan label ekstensi di bawah ikon (dipakai di preview besar). */
	withLabel?: boolean;
}

/**
 * Gambar → <Image> seperti biasa. Selain itu → kotak berisi ikon, karena
 * URL file dokumen tidak bisa dirender <img> dan hasilnya broken image.
 */
export function FilePreview({
	file,
	h = 140,
	fit = "cover",
	withLabel = false,
}: FilePreviewProps) {
	if (file.type === "image") {
		return (
			<Image
				src={getMediaPreviewUrl(file)}
				h={h}
				fit={fit}
				alt={file.altText ?? file.name}
			/>
		);
	}

	const Icon = getFileIcon(file);
	const label = file.extension?.replace(/^\./, "").toUpperCase() || file.type;

	return (
		<Box h={h} bg="var(--mantine-color-gray-1)">
			<Center h="100%">
				<Stack gap={4} align="center">
					<Icon size={40} color="var(--mantine-color-gray-6)" stroke={1.5} />
					{withLabel && (
						<Text size="xs" c="dimmed" fw={500}>
							{label}
						</Text>
					)}
				</Stack>
			</Center>
		</Box>
	);
}
