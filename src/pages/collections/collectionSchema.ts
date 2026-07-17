import { z } from "zod";

export const collectionSchema = z.object({
	name: z.string().trim().min(1, "Collection name is required"),
	slug: z.string().trim().min(1, "Slug is required"),
	status: z.enum(["published", "draft"]),
	productIds: z.array(z.number()),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;
