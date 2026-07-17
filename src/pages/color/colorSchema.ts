import { z } from "zod";

export const colorSchema = z
	.object({
		name: z.string().trim().min(1, "Color name is required"),
		hex: z.string().trim().optional(),
		photo: z.string().optional(),
		notes: z.string().trim().optional(),
		// selectedCategory disimpan sebagai string id Select.
		categoryId: z.string().min(1, "Category is required"),
	})
	// Minimal salah satu warna harus ada: foto atau hex.
	.refine((d) => Boolean(d.photo) || (d.hex?.length ?? 0) > 0, {
		message:
			"Add a photo, or pick an approximate colour — at least one is needed.",
		path: ["hex"],
	});

export type ColorFormData = z.infer<typeof colorSchema>;
