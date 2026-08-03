import type { CustomerSegment } from "@/api/customers";
import type {
	PosOrder,
	PosPaymentMethod,
	PosVariant,
} from "@/api/pointOfSales";

/**
 * Customer terpilih di layar kasir. Sengaja tipe minimal (bukan
 * CustomerListItem utuh) karena customer bisa datang dari 2 sumber:
 * hasil pencarian list (punya `segment`) atau hasil POST create (tanpa
 * `segment`).
 */
export type PosCustomer = {
	id: string;
	name: string;
	phone: string;
	segment?: CustomerSegment;
};

/** Satu baris keranjang. `qty` selalu >= 1. */
export type CartItem = {
	variant: PosVariant;
	qty: number;
};

/** Metode pembayaran versi UI. "card" TIDAK ada di API — lihat POS_METHOD_MAP. */
export type PaymentMethod = "cash" | "card" | "qris" | "transfer";

/**
 * Peta metode UI → nilai yang diterima API (contract.md bagian 18).
 * "card" dipetakan ke "debit" karena API tidak punya nilai generik "card";
 * ini keputusan produk, bukan bug. Kalau nanti kasir perlu membedakan debit
 * dan credit, tombolnya harus dipecah dua di TakePaymentModal.
 */
export const POS_METHOD_MAP: Record<PaymentMethod, PosPaymentMethod> = {
	cash: "cash",
	card: "debit",
	qris: "qris",
	transfer: "transfer",
};

/**
 * Data struk. `order` adalah response server apa adanya; `customerName`
 * disimpan terpisah karena response hanya memuat `customerId`.
 */
export type CompletedSale = {
	order: PosOrder;
	/** null untuk transaksi walk-in. */
	customerName: string | null;
};
