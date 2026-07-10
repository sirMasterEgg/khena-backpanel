import type { Customer, Product } from "@/data/dummy";

/** Satu baris di keranjang. `qty` selalu >= 1. */
export type CartItem = {
	product: Product;
	qty: number;
};

/** Metode pembayaran yang tersedia di modal Take payment. */
export type PaymentMethod = "cash" | "card" | "qris" | "transfer";

/** Hasil transaksi yang sudah selesai (untuk struk). */
export type CompletedSale = {
	id: string; // mis. "POS-1720512000000" (pakai Date.now())
	items: CartItem[];
	customer: Customer;
	total: number;
	itemCount: number; // total qty semua item
	paymentMethod: PaymentMethod;
	createdAt: string; // ISO date, new Date().toISOString()
};
