import { z } from "zod";

export const discountSchema = z
	.object({
		code: z.string().trim().min(1, "Discount code is required"),
		type: z.enum(["percentage", "fixed", "free_shipping"]),
		value: z.number().min(0, "Value must be 0 or greater"),
		appliesTo: z.string(),
		startDate: z.string(),
		endDate: z.string().min(1, "End date is required"),
		// Kosong = tanpa batas.
		usageLimit: z.number().min(0).optional(),
		status: z.enum(["active", "scheduled", "expired"]),
	})
	// Kalau kedua tanggal diisi, end date tidak boleh sebelum start date.
	.refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
		message: "End date must be on or after start date",
		path: ["endDate"],
	});

export type DiscountFormData = z.infer<typeof discountSchema>;
