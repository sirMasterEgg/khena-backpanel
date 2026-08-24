import { z } from "zod";

export const signatureSectionSchema = z.object({
	title: z.string().trim().min(1, "Title is required"),
	imageUrl: z.string().min(1, "Image is required"),
	imageAlt: z.string().trim().min(1, "Image alt text is required"),
});

export type SignatureSectionFormData = z.infer<typeof signatureSectionSchema>;
