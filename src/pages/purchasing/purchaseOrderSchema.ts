import { z } from "zod";

const purchaseOrderItemSchema = z.object({
	productId: z.number(),
	name: z.string(),
	sku: z.string(),
	qty: z.number().min(1),
	unitCost: z.number().min(0),
});

export const purchaseOrderSchema = z.object({
	// Select value string|null; null → supplier belum dipilih.
	supplierId: z.string().nullable(),
	date: z.string(),
	expected: z.string(),
	notes: z.string(),
	items: z.array(purchaseOrderItemSchema),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
