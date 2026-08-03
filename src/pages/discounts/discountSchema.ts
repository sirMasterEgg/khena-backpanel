import { z } from "zod";
import { type DiscountAppliesToType, isEntityType } from "@/api/discounts";

export const discountSchema = z
	.object({
		code: z.string().trim().min(1, "Discount code is required").max(50),
		discountType: z.enum(["percentage", "fixed_amount", "free_shipping"]),
		// Divalidasi lebih ketat per-tipe di superRefine di bawah.
		discountValue: z.number().int().min(0),
		appliesToType: z.enum([
			"all_products",
			"vip_customer",
			"newsletter_subscribers",
			"orders_over_10_million",
			"collection",
			"product",
			"category",
			"customer",
		]),
		/** "" = belum dipilih. Hanya relevan untuk tipe entitas. */
		appliesToId: z.string(),
		/** Format "YYYY-MM-DD" dari Mantine DateInput. */
		startDate: z.string().min(1, "Start date is required"),
		endDate: z.string().min(1, "End date is required"),
		/** undefined = tanpa batas. */
		usageLimit: z.number().int().min(1).optional(),
		status: z.enum(["active", "inactive"]),
	})
	.superRefine((d, ctx) => {
		// Cerminkan aturan server supaya user tidak perlu menunggu response 400.
		if (
			d.discountType === "percentage" &&
			(d.discountValue < 1 || d.discountValue > 100)
		) {
			ctx.addIssue({
				code: "custom",
				path: ["discountValue"],
				message: "Percentage value must be between 1 and 100",
			});
		}
		if (d.discountType === "fixed_amount" && d.discountValue < 1) {
			ctx.addIssue({
				code: "custom",
				path: ["discountValue"],
				message: "Fixed amount value must be greater than 0",
			});
		}
		if (
			isEntityType(d.appliesToType as DiscountAppliesToType) &&
			!d.appliesToId
		) {
			ctx.addIssue({
				code: "custom",
				path: ["appliesToId"],
				message: "Target is required for this applies-to type",
			});
		}
		// Server menolak endDate <= startDate (bukan "<").
		if (d.startDate && d.endDate && d.endDate < d.startDate) {
			ctx.addIssue({
				code: "custom",
				path: ["endDate"],
				message: "End date must be after start date",
			});
		}
	});

export type DiscountFormData = z.infer<typeof discountSchema>;
