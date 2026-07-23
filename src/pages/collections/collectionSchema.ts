import { z } from "zod";

export const collectionSchema = z.object({
	name: z.string().trim().min(1, "Collection name is required"),
	slug: z.string().trim().min(1, "Slug is required"),
	status: z.enum(["published", "draft"]),
	coverId: z.string().min(1, "Cover image is required"),
	heroId: z.string().min(1, "Hero image is required"),
	// ID detail product (varian), string uuid. Boleh kosong.
	productIds: z.array(z.string()),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;
