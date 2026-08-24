import { z } from "zod";

export const DESIGNED_FOR_LIFE_PRODUCT_COUNT = 6;

export const designedForLifeSchema = z.object({
	// Tidak wajib pas 6 — cukup maksimal 6 produk, boleh kurang atau kosong.
	productIds: z
		.array(z.string())
		.max(DESIGNED_FOR_LIFE_PRODUCT_COUNT, "Select at most 6 products"),
});

export type DesignedForLifeFormData = z.infer<typeof designedForLifeSchema>;
