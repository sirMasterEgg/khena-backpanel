import { z } from "zod";

export const heroSectionSchema = z.object({
	eyebrow: z.string().trim(), // opsional
	headline: z.string().trim().min(1, "Headline is required"),
	ctaLabel: z.string().trim(), // opsional
	ctaHref: z.string(), // tanpa "/" di depan
	imageUrl: z.string().min(1, "Hero image is required"),
	// Opsional — alt text TIDAK dipersist ke server (lihat pagesMapper.ts),
	// jadi selalu kosong lagi setiap kali section dibuka ulang. Kalau field
	// ini wajib, user tidak akan pernah bisa Save ulang tanpa mengetik ulang.
	imageAlt: z.string().trim(),
});

export type HeroSectionFormData = z.infer<typeof heroSectionSchema>;
