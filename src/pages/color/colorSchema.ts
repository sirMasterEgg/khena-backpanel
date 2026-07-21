import { z } from "zod";

export const colorSchema = z.object({
	name: z.string().trim().min(1, "Color name is required"),
	// `hex` WAJIB di POST /colors. Boleh diketik dengan atau tanpa "#" —
	// stripHash() yang membuang tandanya sebelum dikirim.
	hex: z
		.string()
		.trim()
		.regex(/^#?[0-9a-fA-F]{6}$/, "Hex harus 6 digit, contoh #b23a2f"),
	// Isinya uuid media (bukan URL) — itulah yang dikirim sebagai `swatchImage`.
	photo: z.string().optional(),
	notes: z.string().trim().optional(),
	// Id finish dari <Select>; di API namanya `finishId`.
	finishId: z.string().min(1, "Material type is required"),
});

export type ColorFormData = z.infer<typeof colorSchema>;
