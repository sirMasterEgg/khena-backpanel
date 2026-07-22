import { z } from "zod";

/**
 * Skema nama material type ("Finish" di API). Body POST /finishes memakai key
 * `finish`, tapi di form field-nya bernama `name` — pemetaan itu dilakukan saat
 * submit, sama seperti pola di colorSchema.ts.
 */
export const finishSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, "Nama material type minimal 2 karakter")
		.max(50, "Nama material type maksimal 50 karakter")
		// Menolak tag HTML/script sejak di client, jadi input berbahaya gagal
		// dengan pesan yang TERLIHAT, bukan gagal diam-diam di backend.
		.regex(
			/^[\p{L}\p{N} ._&/-]+$/u,
			"Hanya huruf, angka, spasi, dan . _ & / - yang diperbolehkan",
		),
});

export type FinishFormData = z.infer<typeof finishSchema>;
