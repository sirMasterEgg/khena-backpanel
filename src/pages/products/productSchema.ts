import { z } from "zod";

export const productVariantSchema = z.object({
	id: z.number(),
	colorFinish: z.string().min(1, "Color/Finish is required"),
	sku: z.string().min(1, "SKU is required"),
	visibility: z.enum(["visible", "hidden"]),
	price: z.number().min(0, "Price must be 0 or greater"),
	cost: z.number().min(0, "Cost must be 0 or greater"),
	discount: z.number().min(0).max(100, "Discount must be between 0 and 100"),
	comparePrice: z.number(),
	marketplacePrice: z.number().min(0),
	stock: z.number().min(0, "Stock must be 0 or greater"),
	images: z.array(z.string()),
});

export const productSchema = z.object({
	name: z.string().min(1, "Product name is required"),
	sku: z.string().min(1, "SKU is required"),
	collection: z.string().min(1, "Collection is required"),
	category: z.string().min(1, "Category is required"),
	status: z.enum(["published", "draft", "scheduled", "archived"]),
	description: z.string(),
	lowStockAlert: z.number().min(0).optional(),
	variants: z.array(productVariantSchema),
	materialInfo: z.string(),
	careCategories: z.array(
		z.enum([
			"high-end-panels",
			"fabric-boucle",
			"wood-accents",
			"stone-marble",
		]),
	),
	dimension: z
		.object({
			image: z.string().optional(),
			width: z.number().optional(),
			depth: z.number().optional(),
			height: z.number().optional(),
			weight: z.number().optional(),
		})
		.optional(),
	boxDimension: z
		.object({
			image: z.string().optional(),
			width: z.number().optional(),
			depth: z.number().optional(),
			height: z.number().optional(),
			weight: z.number().optional(),
		})
		.optional(),
	media: z.array(z.string()),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductCareCategoryValue =
	ProductFormData["careCategories"][number];
