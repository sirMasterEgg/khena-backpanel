import { z } from "zod";

export const PAYMENT_METHODS = [
	"cash",
	"transfer",
	"debit",
	"credit",
	"qris",
] as const;

const itemSchema = z.object({
	detailProductId: z.string().min(1, "Produk wajib dipilih"),
	// 4 field di bawah HANYA snapshot untuk tampilan & hitung subtotal;
	// TIDAK ikut dikirim ke API. Disimpan di baris agar nama/harga tidak
	// hilang saat daftar hasil pencarian berganti.
	variantName: z.string(),
	sku: z.string(),
	price: z.number(),
	stock: z.number(),
	quantity: z.number().int().min(1, "Minimal 1"),
});

export const orderSalesSchema = z
	.object({
		customerId: z.string().min(1, "Customer wajib dipilih"),
		orderDate: z.string().min(1, "Order date wajib diisi"),
		paymentMethod: z.enum(PAYMENT_METHODS),
		shippingAddress: z.string().min(1, "Alamat wajib diisi"),
		shippingCity: z.string().min(1, "Kota wajib diisi").max(100),
		shippingProvince: z.string().min(1, "Provinsi wajib diisi").max(100),
		shippingZipCode: z.string().min(1, "Kode pos wajib diisi").max(20),
		internalNote: z.string(),
		items: z.array(itemSchema).min(1, "Minimal 1 item"),
	})
	.superRefine((v, ctx) => {
		// API balas 400 "duplicate product in items" — cegah di client.
		const seen = new Set<string>();
		v.items.forEach((item, i) => {
			if (item.detailProductId && seen.has(item.detailProductId)) {
				ctx.addIssue({
					code: "custom",
					path: ["items", i, "detailProductId"],
					message: "Produk ini sudah ditambahkan di baris lain",
				});
			}
			seen.add(item.detailProductId);

			// API balas 400 "insufficient stock for <SKU>" — cegah lebih awal.
			if (item.detailProductId && item.quantity > item.stock) {
				ctx.addIssue({
					code: "custom",
					path: ["items", i, "quantity"],
					message: `Stok tersisa ${item.stock}`,
				});
			}
		});
	});

export type OrderSalesFormData = z.infer<typeof orderSalesSchema>;
