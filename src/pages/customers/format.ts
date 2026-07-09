// Helper format kecil khusus halaman Customers.

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
