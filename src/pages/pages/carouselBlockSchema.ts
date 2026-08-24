import { z } from "zod";

export const carouselSlideSchema = z.object({
	id: z.string(),
	mediaUrl: z.string().min(1),
	caption: z.string(),
});

export const carouselBlockSchema = z.object({
	name: z.string().trim().min(1, "Block name is required"),
	headline: z.string().trim(),
	// Opsional — sama seperti landingBlockSchema, tanpa .default() supaya
	// tipe hasil z.infer tetap `string`, bukan `string | undefined`.
	buttonLabel: z.string().trim(),
	buttonDestination: z.string(),
	slides: z.array(carouselSlideSchema),
	// Rentang slider auto-rotation, dalam detik.
	slideDurationSec: z.number().min(2).max(15),
	status: z.enum(["published", "draft"]),
});

export type CarouselBlockFormData = z.infer<typeof carouselBlockSchema>;

export const MIN_SLIDE_SECONDS = 2;
export const MAX_SLIDE_SECONDS = 15;
export const DURATION_PRESETS = [3, 5, 8, 10];
