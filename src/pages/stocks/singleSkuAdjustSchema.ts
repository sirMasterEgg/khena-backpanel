import { z } from "zod";
import type { Product } from "@/data/dummy";

/**
 * Skema dibuat lewat factory karena validasi SKU perlu mencocokkan
 * ke daftar produk yang ada (bukan aturan statis).
 */
export const makeSingleSkuAdjustSchema = (products: Product[]) =>
	z.object({
		sku: z
			.string()
			.trim()
			.min(1, "No product with that SKU yet")
			.refine(
				(v) => products.some((p) => p.sku.toLowerCase() === v.toLowerCase()),
				"No product with that SKU yet",
			),
		action: z.enum(["in", "out"]),
		// Change disimpan sebagai string (input teks), harus angka positif.
		change: z
			.string()
			.trim()
			.refine((v) => {
				const n = Number(v);
				return v.length > 0 && !Number.isNaN(n) && n > 0;
			}, "Enter a valid quantity (a positive number)"),
		reason: z.string().trim().min(1, "Please enter a reason"),
	});

export type SingleSkuAdjustFormData = z.infer<
	ReturnType<typeof makeSingleSkuAdjustSchema>
>;
