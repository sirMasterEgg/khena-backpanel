import { z } from "zod";

export const DESIGNED_FOR_LIFE_PRODUCT_COUNT = 6;

export const designedForLifeSchema = z.object({
	productIds: z
		.array(z.string())
		.length(DESIGNED_FOR_LIFE_PRODUCT_COUNT, "Select exactly 6 products"),
});

export type DesignedForLifeFormData = z.infer<typeof designedForLifeSchema>;
