// Helper format untuk halaman Discounts.
// Rupiah memakai formatter yang sama dengan halaman Customers, jadi cukup
// di-re-export agar tidak menduplikasi implementasi.

export { formatCurrency } from "@/pages/customers/format";

import type { DiscountType } from "@/api/discounts";
import { formatCurrency } from "@/pages/customers/format";

const periodDateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

/**
 * Format startDate/endDate diskon: "1 Sep 2026". `startDate`/`endDate`
 * disimpan sebagai batas hari UTC (00:00:00.000Z / 23:59:59.999Z) — TIDAK
 * boleh dipakai `formatDate` biasa (timezone lokal), karena di timezone
 * dengan offset positif (mis. WIB, UTC+7) endDate 23:59:59.999Z bisa
 * bergeser ke hari berikutnya.
 */
export function formatDiscountDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return periodDateFormatter.format(date);
}

/** Teks kolom "Type": "10% off" | "Rp 50.000 off" | "Free shipping". */
export function formatDiscountType(type: DiscountType, value: number): string {
	switch (type) {
		case "percentage":
			return `${value}% off`;
		case "fixed_amount":
			return `${formatCurrency(value)} off`;
		case "free_shipping":
			return "Free shipping";
	}
}

/** Teks kolom "Used": "42 / 100" bila ada limit, else "42". */
export function formatUsage(used: number, usageLimit: number | null): string {
	return usageLimit ? `${used} / ${usageLimit}` : `${used}`;
}
