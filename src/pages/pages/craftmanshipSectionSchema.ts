import { z } from "zod";

export const craftmanshipSlideSchema = z.object({
	id: z.string(),
	imageUrl: z.string().min(1),
	imageAlt: z.string(), // opsional — belum ditampilkan di UI, lihat issue #90
	title: z.string(),
	body: z.string(),
});

export const craftmanshipSectionSchema = z.object({
	eyebrow: z.string().trim(), // opsional — dikirim ke storefront sebagai `eyebrow`
	ctaLabel: z.string().trim(),
	ctaHref: z.string(),
	slides: z
		.array(craftmanshipSlideSchema)
		.min(1, "At least one slide is required"),
	slideDurationSec: z.number().min(2).max(15),
});

export type CraftmanshipSlideFormData = z.infer<typeof craftmanshipSlideSchema>;
export type CraftmanshipSectionFormData = z.infer<
	typeof craftmanshipSectionSchema
>;

export const MIN_SLIDE_SECONDS = 2;
export const MAX_SLIDE_SECONDS = 15;
export const DURATION_PRESETS = [3, 5, 8, 10];
