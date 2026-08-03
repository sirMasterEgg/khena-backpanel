import { z } from "zod";

export const singleSkuAdjustSchema = z.object({
	sku: z.string().trim().min(1, "SKU wajib diisi"),
	action: z.enum(["in", "out"]),
	// Change disimpan sebagai string (input teks), harus INTEGER positif.
	change: z
		.string()
		.trim()
		.refine((v) => {
			const n = Number(v);
			return v.length > 0 && Number.isInteger(n) && n > 0;
		}, "Enter a valid quantity (a positive number)"),
	reason: z.string().trim().min(1, "Please enter a reason"),
});

export type SingleSkuAdjustFormData = z.infer<typeof singleSkuAdjustSchema>;
