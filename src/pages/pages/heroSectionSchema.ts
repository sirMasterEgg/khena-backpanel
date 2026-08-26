import { z } from "zod";

export const heroSectionSchema = z.object({
	eyebrow: z.string().trim(), // opsional
	headline: z.string().trim().min(1, "Headline is required"),
	ctaLabel: z.string().trim(), // opsional
	ctaHref: z.string(), // tanpa "/" di depan
	imageUrl: z.string().min(1, "Hero image is required"),
	imageAlt: z.string().trim().min(1, "Image alt text is required"),
});

export type HeroSectionFormData = z.infer<typeof heroSectionSchema>;
