import { z } from "zod";
import { HEX_PATTERN } from "@/api/colors";

export const colorSchema = z.object({
	name: z.string().trim().min(1, "Color name is required"),
	// `hex` WAJIB di POST /colors, disimpan tanpa "#". HexColorInput sudah
	// menyaring karakter non-hex saat mengetik, jadi satu-satunya pelanggaran
	// yang mungkin sampai sini adalah panjangnya kurang dari 6.
	hex: z
		.string()
		.trim()
		.regex(HEX_PATTERN, "Hex harus 6 karakter, contoh b23a2f"),
	// Isinya uuid media (bukan URL) — itulah yang dikirim sebagai `swatchImage`.
	photo: z.string().optional(),
	notes: z.string().trim().optional(),
	// Id finish dari <Select>; di API namanya `finishId`.
	finishId: z.string().min(1, "Material type is required"),
});

export type ColorFormData = z.infer<typeof colorSchema>;
