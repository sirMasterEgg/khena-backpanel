// Helper format kecil khusus halaman Customers.

import type { Customer } from "@/data/dummy";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

/** Format angka Rupiah, mis. 15000000 → "Rp 15.000.000". */
export function formatCurrency(value: number): string {
	return currencyFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	day: "numeric",
	month: "short",
	year: "numeric",
});

/** Format tanggal singkat, mis. "9 Jul 2026". `null` → "—". */
export function formatDate(iso: string | null): string {
	if (!iso) return "—";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return dateFormatter.format(date);
}

export type DataIssueLevel = "error" | "warning";

export type DataIssue = {
	level: DataIssueLevel;
	title: string;
	detail: string;
};

/** Kembalikan masalah data customer, atau null kalau tidak ada. */
export function getDataIssue(customer: Customer): DataIssue | null {
	if (!customer.email) {
		return {
			level: "error",
			title: "Missing email address",
			detail:
				"This customer has no email. You can't send order updates until it's fixed.",
		};
	}
	if (!customer.phone) {
		return {
			level: "warning",
			title: "Incomplete contact info",
			detail: "No phone number on file. Add one so the courier can reach them.",
		};
	}
	if (customer.hasDataIssue) {
		return {
			level: "warning",
			title: "Data needs review",
			detail: "Some information looks incomplete. Please review and update.",
		};
	}
	return null;
}
