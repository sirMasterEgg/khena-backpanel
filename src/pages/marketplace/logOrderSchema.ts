import { z } from "zod";

export const logOrderSchema = z
	.object({
		marketplace: z.string().trim().min(1, "Marketplace is required").max(50),
		date: z.string().min(1, "Date is required"), // "YYYY-MM-DD"
		orderId: z.string().trim().min(1, "Order ID is required").max(50),
		buyerName: z.string().trim().min(1, "Buyer name is required").max(255),
		items: z
			.array(
				z.object({
					variantSku: z.string().min(1, "SKU is required"),
					productName: z.string(), // hanya untuk tampilan, tidak dikirim ke server
					quantity: z.number().int().min(1, "Quantity must be at least 1"),
					revenue: z.number().int().min(0, "Revenue cannot be negative"),
				}),
			)
			.min(1, "Add at least one item"),
	})
	.superRefine((d, ctx) => {
		// Cerminkan aturan server supaya user tidak perlu menunggu response 400.
		d.items.forEach((item, i) => {
			if (item.quantity > 0 && item.revenue % item.quantity !== 0) {
				ctx.addIssue({
					code: "custom",
					path: ["items", i, "revenue"],
					message: "Revenue must be divisible by quantity",
				});
			}
		});

		// Server menolak "duplicate sku in items".
		const seen = new Set<string>();
		d.items.forEach((item, i) => {
			if (seen.has(item.variantSku)) {
				ctx.addIssue({
					code: "custom",
					path: ["items", i, "variantSku"],
					message: "This SKU is already in the list",
				});
			}
			seen.add(item.variantSku);
		});
	});

export type LogOrderFormData = z.infer<typeof logOrderSchema>;
