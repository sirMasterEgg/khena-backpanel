import { z } from "zod";

const purchaseOrderProductSchema = z.object({
	detailProductId: z.string().min(1),
	// Dua field di bawah HANYA untuk tampilan tabel; tidak ikut dikirim ke API.
	productName: z.string(),
	sku: z.string(),
	quantity: z.number().int().min(1, "Minimal 1"),
	unitCost: z.number().int().min(0, "Tidak boleh negatif"),
});

/**
 * Draft boleh disimpan tanpa item, jadi skema tidak mewajibkan `products`.
 * Aturan "minimal 1 item" hanya berlaku saat PO di-order — dicek di modal.
 */
export const MIN_ITEMS_MESSAGE = "Minimal 1 item sebelum bisa di-order";

export const purchaseOrderSchema = z
	.object({
		supplierId: z.string().min(1, "Supplier wajib dipilih"),
		orderDate: z.string().min(1, "Order date wajib diisi"),
		expectedDeliveryDate: z.string(), // boleh "" → dikirim sebagai undefined/null
		note: z.string(),
		products: z.array(purchaseOrderProductSchema),
	})
	.refine(
		(v) => !v.expectedDeliveryDate || v.expectedDeliveryDate >= v.orderDate,
		{
			path: ["expectedDeliveryDate"],
			message: "Tidak boleh lebih awal dari order date",
		},
	)
	.refine(
		(v) => new Set(v.products.map((p) => p.detailProductId)).size ===
			v.products.length,
		{ path: ["products"], message: "Ada produk yang sama ditambahkan dua kali" },
	);

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
