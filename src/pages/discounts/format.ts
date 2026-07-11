// Helper format untuk halaman Discounts.
// Rupiah & tanggal memakai formatter yang sama dengan halaman Customers,
// jadi cukup di-re-export agar tidak menduplikasi implementasi.

export { formatCurrency, formatDate } from "@/pages/customers/format";

import type { Discount, DiscountStatus } from "@/data/dummy";
import { formatCurrency } from "@/pages/customers/format";

/** Teks kolom "Type": "10% off" | "Rp 50.000 off" | "Free shipping". */
export function formatDiscountType(d: Discount): string {
	switch (d.type) {
		case "percentage":
			return `${d.value}% off`;
		case "fixed":
			return `${formatCurrency(d.value)} off`;
		case "free_shipping":
			return "Free shipping";
	}
}

/** Teks kolom "Used": "42 / 100" bila ada limit, else "42". */
export function formatUsage(d: Discount): string {
	return d.usageLimit ? `${d.used} / ${d.usageLimit}` : `${d.used}`;
}

/**
 * Hitung status diskon otomatis dari rentang tanggal (dibanding hari ini):
 * sebelum startDate → "scheduled", setelah endDate → "expired",
 * di antaranya → "active".
 */
export function computeStatus(
	startDate: string,
	endDate: string,
): DiscountStatus {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const start = new Date(startDate);
	const end = new Date(endDate);
	if (today < start) return "scheduled";
	if (today > end) return "expired";
	return "active";
}
