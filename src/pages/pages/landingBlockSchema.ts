import { z } from "zod";

export const landingBlockSchema = z.object({
	name: z.string().trim().min(1, "Block name is required"),
	headline: z.string().trim().min(1, "Headline is required"),
	// Opsional — blok tanpa tombol adalah kondisi yang sah. Tanpa .default()
	// supaya tipe hasil z.infer tetap `string` (bukan `string | undefined`);
	// nilai awal selalu disuplai lewat defaultValues di form.
	buttonLabel: z.string().trim(),
	// Free text — kosong berarti "no destination set".
	buttonDestination: z.string(),
	mediaUrl: z.string().min(1, "Hero image is required"),
});

export type LandingBlockFormData = z.infer<typeof landingBlockSchema>;
