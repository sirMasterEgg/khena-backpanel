// Helper format kecil khusus halaman Products.

const currencyFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

/** Format angka Rupiah, mis. 2500000 → "Rp 2.500.000". */
export function formatCurrency(value: number): string {
	return currencyFormatter.format(value);
}
