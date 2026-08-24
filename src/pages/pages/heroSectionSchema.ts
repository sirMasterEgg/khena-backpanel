import { z } from "zod";

export const heroSectionSchema = z.object({
	subtitle: z.string().trim(), // opsional
	title: z.string().trim().min(1, "Title is required"),
	ctaText: z.string().trim(), // opsional
	ctaLink: z.string(), // tanpa "/" di depan
	imageUrl: z.string().min(1, "Hero image is required"),
	imageAlt: z.string().trim().min(1, "Image alt text is required"),
});

export type HeroSectionFormData = z.infer<typeof heroSectionSchema>;
