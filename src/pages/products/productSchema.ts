import { z } from "zod";

/**
 * Skema form product — bentuknya mengikuti body POST /products (contract.md
 * bagian 6) supaya nilai form bisa dikirim tanpa mapping tambahan.
 * Pengecualian: `comparePrice` pada varian hanya untuk tampilan (dihitung dari
 * price + discount) dan TIDAK ikut dikirim ke API.
 */

/** `{ width, depth, height, weight, image }` — semua wajib. `image` = uuid media. */
const dimensionSchema = z.object({
	width: z.number("Width is required").min(0, "Width must be 0 or greater"),
	depth: z.number("Depth is required").min(0, "Depth must be 0 or greater"),
	height: z.number("Height is required").min(0, "Height must be 0 or greater"),
	weight: z.number("Weight is required").min(0, "Weight must be 0 or greater"),
	image: z.string().min(1, "Dimension image is required"),
});

export const productVariantSchema = z.object({
	/** uuid; terisi = varian lama (dipertahankan untuk PATCH). */
	id: z.string().optional(),
	colorId: z.string().min(1, "Color is required"),
	/** Harus diawali baseSku — divalidasi di superRefine level product. */
	sku: z.string().min(1, "SKU is required"),
	visibility: z.enum(["visible", "hidden"]),
	price: z.number().min(0, "Price must be 0 or greater"),
	capitalPrice: z.number().min(0, "Cost must be 0 or greater"),
	discountPercent: z
		.number()
		.min(0)
		.max(100, "Discount must be between 0 and 100")
		.optional(),
	/** UI-only: dihitung otomatis dari price + discount, tidak dikirim ke API. */
	comparePrice: z.number().optional(),
	marketplacePrice: z
		.number()
		.min(0, "Marketplace price must be 0 or greater")
		.optional(),
	/** Hanya dipakai backend untuk varian BARU; varian lama mengabaikannya. */
	initialStock: z.number().min(0, "Stock must be 0 or greater"),
	/** uuid media, bukan URL. */
	images: z.array(z.string()).min(1, "At least one image is required"),
});

export const productSchema = z
	.object({
		productName: z.string().min(1, "Product name is required"),
		baseSku: z.string().min(1, "SKU is required"),
		collectionId: z.string().optional(),
		categoryId: z.string().min(1, "Category is required"),
		status: z.enum(["published", "draft", "scheduled", "archived"]),
		description: z.string().optional(),
		lowStockAlert: z.number().min(0).optional(),
		materialInformation: z.string().min(1, "Material information is required"),
		/** uuid care instruction dari GET /care-instructions, minimal 1. */
		careInstructionIds: z
			.array(z.string())
			.min(1, "Select at least one care instruction"),
		productDimension: dimensionSchema,
		boxDimension: dimensionSchema,
		/** uuid media showcase, minimal 1. */
		media: z.array(z.string()).min(1, "At least one image is required"),
		variant: z.array(productVariantSchema).min(1, "At least one variant"),
	})
	.superRefine((data, ctx) => {
		// Aturan API: tiap sku varian HARUS diawali baseSku — ditahan di frontend
		// supaya user tahu sebelum submit. Error menempel di field sku varian ybs.
		if (!data.baseSku) return;
		data.variant.forEach((variant, idx) => {
			if (variant.sku && !variant.sku.startsWith(data.baseSku)) {
				ctx.addIssue({
					code: "custom",
					path: ["variant", idx, "sku"],
					message: `Variant SKU harus diawali "${data.baseSku}"`,
				});
			}
		});
	});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductVariantFormData = z.infer<typeof productVariantSchema>;
